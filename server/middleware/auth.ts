import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";
import { storage } from "../storage";

// Extend Request type to include authenticated user
export interface AuthRequest extends Request {
  user: User & {
    companyId: number;
  };
}

// Type guard to check if request is authenticated
export function isAuthenticatedRequest(req: Request): req is AuthRequest {
  return req.user !== undefined && req.user.companyId !== undefined;
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Admin middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAuthenticatedRequest(req) || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
}

// HR middleware
export function isHR(req: Request, res: Response, next: NextFunction) {
  if (!isAuthenticatedRequest(req) || req.user.role !== "hr") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
}

// Manager middleware
export function isManager(req: Request, res: Response, next: NextFunction) {
  if (!isAuthenticatedRequest(req) || req.user.role !== "manager") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
}

// Helper function to handle activity logging
export async function logActivity(req: Request, action: string, details: string) {
  if (!isAuthenticatedRequest(req)) {
    throw new Error("Unauthorized");
  }
  await storage.createActivityLog({
    userId: req.user.id,
    companyId: req.user.companyId,
    action,
    details
  });
} 