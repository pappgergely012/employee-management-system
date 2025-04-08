import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAuthenticatedRequest, logActivity } from "../middleware/auth";
import { insertShiftSchema } from "@shared/schema";

export function setupShiftRoutes(app: Express) {
  // Get all shifts
  app.get("/api/shifts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const shifts = await storage.getShifts(req.user.companyId);
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  // Get single shift
  app.get("/api/shifts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const shift = await storage.getShift(id);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }

      // Verify shift belongs to user's company
      if (shift.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(shift);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shift" });
    }
  });

  // Create shift
  app.post("/api/shifts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertShiftSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const shift = await storage.createShift(validatedData);
      await logActivity(req, "CREATE_SHIFT", `Created shift ${shift.name}`);
      res.status(201).json(shift);
    } catch (error) {
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  // Update shift
  app.put("/api/shifts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const shift = await storage.getShift(id);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }

      // Verify shift belongs to user's company
      if (shift.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertShiftSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const updatedShift = await storage.updateShift(id, validatedData);
      await logActivity(req, "UPDATE_SHIFT", `Updated shift ${updatedShift.name}`);
      res.json(updatedShift);
    } catch (error) {
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  // Delete shift
  app.delete("/api/shifts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const shift = await storage.getShift(id);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }

      // Verify shift belongs to user's company
      if (shift.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteShift(id);
      await logActivity(req, "DELETE_SHIFT", `Deleted shift ${shift.name}`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });
} 