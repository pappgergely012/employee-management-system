import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin, isHR, isAuthenticatedRequest, logActivity } from "../middleware/auth";
import { insertDepartmentSchema } from "@shared/schema";
import { z } from "zod";

export function setupDepartmentRoutes(app: Express) {
  // Get all departments
  app.get("/api/departments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const departments = await storage.getDepartments(req.user.companyId);
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Get single department
  app.get("/api/departments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      // Verify department belongs to user's company
      if (department.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(department);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch department" });
    }
  });

  // Create department
  app.post("/api/departments", isHR, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertDepartmentSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      const newDepartment = await storage.createDepartment(validatedData);

      await logActivity(req, "Department Created", `Department "${validatedData.name}" created`);
      res.status(201).json(newDepartment);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
        });
      }
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  // Update department
  app.put("/api/departments/:id", isHR, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      
      // Get existing department
      const existingDepartment = await storage.getDepartment(id);
      if (!existingDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      // Verify department belongs to user's company
      if (existingDepartment.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertDepartmentSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      
      const updatedDepartment = await storage.updateDepartment(id, validatedData);
      await logActivity(req, "Department Updated", `Department "${validatedData.name}" updated`);
      res.json(updatedDepartment);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
        });
      }
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  // Delete department
  app.delete("/api/departments/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      
      // Get department for activity log
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      // Verify department belongs to user's company
      if (department.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if department has employees
      const employees = await storage.getEmployeesByDepartment(id);
      if (employees.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete department with employees. Reassign employees first." 
        });
      }

      const success = await storage.deleteDepartment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Department not found" });
      }

      await logActivity(req, "Department Deleted", `Department "${department.name}" deleted`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete department" });
    }
  });
} 