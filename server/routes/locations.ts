import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAuthenticatedRequest, logActivity } from "../middleware/auth";
import { insertLocationSchema } from "@shared/schema";

export function setupLocationRoutes(app: Express) {
  // Get all locations
  app.get("/api/locations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const locations = await storage.getLocations(req.user.companyId);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // Get single location
  app.get("/api/locations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Verify location belongs to user's company
      if (location.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  // Create location
  app.post("/api/locations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertLocationSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const location = await storage.createLocation(validatedData);
      await logActivity(req, "CREATE_LOCATION", `Created location ${location.name}`);
      res.status(201).json(location);
    } catch (error) {
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  // Update location
  app.put("/api/locations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Verify location belongs to user's company
      if (location.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertLocationSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const updatedLocation = await storage.updateLocation(id, validatedData);
      await logActivity(req, "UPDATE_LOCATION", `Updated location ${updatedLocation.name}`);
      res.json(updatedLocation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Delete location
  app.delete("/api/locations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Verify location belongs to user's company
      if (location.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteLocation(id);
      await logActivity(req, "DELETE_LOCATION", `Deleted location ${location.name}`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete location" });
    }
  });
} 