import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAuthenticatedRequest } from "../middleware/auth";

export function setupDashboardRoutes(app: Express) {
  app.get("/api/dashboard/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const stats = await storage.getDashboardStats(req.user.companyId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/department-distribution", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const distribution = await storage.getDepartmentDistribution(req.user.companyId);
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch department distribution" });
    }
  });

  app.get("/api/dashboard/recent-employees", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const limit = parseInt(req.query.limit as string) || 5;
      const employees = await storage.getRecentEmployees(limit, req.user.companyId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent employees" });
    }
  });

  app.get("/api/dashboard/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const limit = parseInt(req.query.limit as string) || 5;
      const activities = await storage.getRecentActivities(limit, req.user.companyId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/dashboard/upcoming-events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const limit = parseInt(req.query.limit as string) || 5;
      const events = await storage.getUpcomingEvents(limit, req.user.companyId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });
} 