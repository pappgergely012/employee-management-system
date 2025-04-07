import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "ems-secret-key";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // User schema with validation
  const registerSchema = insertUserSchema.extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: z.string().min(3, "Full name is required"),
    email: z.string().email("Invalid email format"),
    role: z.enum(["admin", "hr", "manager", "user"], {
      errorMap: () => ({ message: "Invalid role" }),
    }),
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      
      // Set role to 'admin' for all newly registered users who weren't invited
      // This makes any new registration a super admin
      const user = await storage.createUser({
        ...validatedData,
        role: 'admin', // Override with admin role
        password: hashedPassword,
      });

      // Create activity log for user creation
      await storage.createActivityLog({
        userId: user.id,
        action: "User Registration",
        details: `New user ${validatedData.username} registered as admin (super admin)`
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Create activity log for login
        await storage.createActivityLog({
          userId: user.id,
          action: "User Login",
          details: `User ${user.username} logged in`
        });
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    // Create activity log for logout if user is authenticated
    if (req.isAuthenticated()) {
      await storage.createActivityLog({
        userId: req.user.id,
        action: "User Logout",
        details: `User ${req.user.username} logged out`
      });
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Role based middleware
  app.use('/api/admin/*', (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Insufficient permissions" });
    next();
  });

  app.use('/api/hr/*', (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user has admin role
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Insufficient permissions" });
}

// Middleware to check if user has HR role
export function isHR(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'hr')) {
    return next();
  }
  res.status(403).json({ message: "Insufficient permissions" });
}

// Middleware to check if user has manager role
export function isManager(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && 
      (req.user.role === 'admin' || req.user.role === 'hr' || req.user.role === 'manager')) {
    return next();
  }
  res.status(403).json({ message: "Insufficient permissions" });
}
