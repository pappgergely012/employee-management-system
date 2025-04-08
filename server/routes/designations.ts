import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin, isHR, isAuthenticatedRequest, logActivity } from "../middleware/auth";
import { insertDesignationSchema } from "@shared/schema";
import { z } from "zod";

export function setupDesignationRoutes(app: Express) {
  // Get all designations
  app.get("/api/designations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const designations = await storage.getDesignations(req.user.companyId);
      res.json(designations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch designations" });
    }
  });

  // Get designations by department
  app.get("/api/designations/department/:departmentId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const departmentId = parseInt(req.params.departmentId);
      
      // Verify department belongs to user's company
      const department = await storage.getDepartment(departmentId);
      if (!department || department.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const designations = await storage.getDesignationsByDepartment(departmentId);
      res.json(designations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch designations by department" });
    }
  });

  // Get single designation
  app.get("/api/designations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const designation = await storage.getDesignation(id);
      if (!designation) {
        return res.status(404).json({ message: "Designation not found" });
      }

      // Verify designation belongs to user's company
      const department = await storage.getDepartment(designation.departmentId);
      if (!department || department.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(designation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch designation" });
    }
  });

  // Create designation
  app.post("/api/designations", isHR, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertDesignationSchema.parse(req.body);
      
      // Verify department exists and belongs to user's company
      const department = await storage.getDepartment(validatedData.departmentId);
      if (!department || department.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const newDesignation = await storage.createDesignation(validatedData);
      await logActivity(req, "Designation Created", `Designation "${validatedData.name}" created for department "${department.name}"`);
      res.status(201).json(newDesignation);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
        });
      }
      res.status(500).json({ message: "Failed to create designation" });
    }
  });

  // Update designation
  app.put("/api/designations/:id", isHR, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const validatedData = insertDesignationSchema.parse(req.body);
      
      // Verify department exists and belongs to user's company
      const department = await storage.getDepartment(validatedData.departmentId);
      if (!department || department.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedDesignation = await storage.updateDesignation(id, validatedData);
      
      if (!updatedDesignation) {
        return res.status(404).json({ message: "Designation not found" });
      }

      await logActivity(req, "Designation Updated", `Designation "${validatedData.name}" updated`);
      res.json(updatedDesignation);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
        });
      }
      res.status(500).json({ message: "Failed to update designation" });
    }
  });

  // Delete designation
  app.delete("/api/designations/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      
      // Get designation for activity log
      const designation = await storage.getDesignation(id);
      if (!designation) {
        return res.status(404).json({ message: "Designation not found" });
      }

      // Verify designation belongs to user's company
      const department = await storage.getDepartment(designation.departmentId);
      if (!department || department.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteDesignation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Designation not found" });
      }

      await logActivity(req, "Designation Deleted", `Designation "${designation.name}" deleted`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete designation" });
    }
  });
} 