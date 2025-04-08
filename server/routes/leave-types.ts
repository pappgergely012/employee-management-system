import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAuthenticatedRequest, logActivity } from "../middleware/auth";
import { insertLeaveTypeSchema } from "@shared/schema";

export function setupLeaveTypeRoutes(app: Express) {
  // Get all leave types
  app.get("/api/leave-types", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const leaveTypes = await storage.getLeaveTypes(req.user.companyId);
      res.json(leaveTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave types" });
    }
  });

  // Get single leave type
  app.get("/api/leave-types/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const leaveType = await storage.getLeaveType(id);
      
      if (!leaveType) {
        return res.status(404).json({ message: "Leave type not found" });
      }

      // Verify leave type belongs to user's company
      if (leaveType.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(leaveType);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave type" });
    }
  });

  // Create leave type
  app.post("/api/leave-types", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertLeaveTypeSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const leaveType = await storage.createLeaveType(validatedData);
      await logActivity(req, "CREATE_LEAVE_TYPE", `Created leave type ${leaveType.name}`);
      res.status(201).json(leaveType);
    } catch (error) {
      res.status(500).json({ message: "Failed to create leave type" });
    }
  });

  // Update leave type
  app.put("/api/leave-types/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const leaveType = await storage.getLeaveType(id);
      
      if (!leaveType) {
        return res.status(404).json({ message: "Leave type not found" });
      }

      // Verify leave type belongs to user's company
      if (leaveType.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertLeaveTypeSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const updatedLeaveType = await storage.updateLeaveType(id, validatedData);
      if (!updatedLeaveType) {
        return res.status(404).json({ message: "Leave type not found" });
      }

      await logActivity(req, "UPDATE_LEAVE_TYPE", `Updated leave type ${updatedLeaveType.name}`);
      res.json(updatedLeaveType);
    } catch (error) {
      res.status(500).json({ message: "Failed to update leave type" });
    }
  });

  // Delete leave type
  app.delete("/api/leave-types/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const leaveType = await storage.getLeaveType(id);
      
      if (!leaveType) {
        return res.status(404).json({ message: "Leave type not found" });
      }

      // Verify leave type belongs to user's company
      if (leaveType.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteLeaveType(id);
      await logActivity(req, "DELETE_LEAVE_TYPE", `Deleted leave type ${leaveType.name}`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete leave type" });
    }
  });
} 