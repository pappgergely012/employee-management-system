import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAuthenticatedRequest, logActivity } from "../middleware/auth";
import { insertLeaveSchema } from "@shared/schema";
import { z } from "zod";

export function setupLeaveRoutes(app: Express) {
  // Get all leaves
  app.get("/api/leaves", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const leaves = await storage.getLeaves(req.user.companyId);
      res.json(leaves);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaves" });
    }
  });

  // Get leaves for a specific employee
  app.get("/api/leaves/employee/:employeeId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const employeeId = parseInt(req.params.employeeId);
      const leaves = await storage.getLeavesByEmployee(employeeId);
      res.json(leaves);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee leaves" });
    }
  });

  // Get single leave
  app.get("/api/leaves/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const leave = await storage.getLeave(id);
      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }
      
      // Verify leave belongs to user's company
      if (leave.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(leave);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave" });
    }
  });

  // Create leave
  app.post("/api/leaves", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertLeaveSchema.parse({
        ...req.body,
        companyId: req.user.companyId,
        status: "pending"
      });
      const newLeave = await storage.createLeave(validatedData);

      await logActivity(req, "Leave Created", `Leave request created for employee ${validatedData.employeeId}`);
      res.status(201).json(newLeave);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
        });
      }
      res.status(500).json({ message: "Failed to create leave" });
    }
  });

  // Update leave
  app.put("/api/leaves/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      
      // Get existing leave
      const existingLeave = await storage.getLeave(id);
      if (!existingLeave) {
        return res.status(404).json({ message: "Leave not found" });
      }
      
      // Verify leave belongs to user's company
      if (existingLeave.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertLeaveSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      
      const updatedLeave = await storage.updateLeave(id, validatedData);
      await logActivity(req, "Leave Updated", `Leave request ${id} updated to status: ${validatedData.status}`);
      res.json(updatedLeave);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
        });
      }
      res.status(500).json({ message: "Failed to update leave" });
    }
  });

  // Delete leave
  app.delete("/api/leaves/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      
      // Get leave for activity log
      const leave = await storage.getLeave(id);
      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }

      // Verify leave belongs to user's company
      if (leave.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteLeave(id);
      await logActivity(req, "Leave Deleted", `Leave request ${id} deleted`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete leave" });
    }
  });
} 