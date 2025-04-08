import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin, isHR, isAuthenticatedRequest, logActivity } from "../middleware/auth";
import { insertEmployeeTypeSchema } from "@shared/schema";
import { z } from "zod";

export function setupEmployeeTypeRoutes(app: Express) {
  // Get all employee types
  app.get("/api/employee-types", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const employeeTypes = await storage.getEmployeeTypes(req.user.companyId);
      res.json(employeeTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee types" });
    }
  });

  // Get single employee type
  app.get("/api/employee-types/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const employeeType = await storage.getEmployeeType(id);
      if (!employeeType) {
        return res.status(404).json({ message: "Employee type not found" });
      }

      // Verify employee type belongs to user's company
      if (employeeType.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(employeeType);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee type" });
    }
  });

  // Create employee type
  app.post("/api/employee-types", isHR, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertEmployeeTypeSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const newEmployeeType = await storage.createEmployeeType(validatedData);
      await logActivity(req, "Employee Type Created", `Employee type "${validatedData.name}" created`);
      res.status(201).json(newEmployeeType);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
        });
      }
      res.status(500).json({ message: "Failed to create employee type" });
    }
  });

  // Update employee type
  app.put("/api/employee-types/:id", isHR, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      
      // Get existing employee type
      const existingEmployeeType = await storage.getEmployeeType(id);
      if (!existingEmployeeType) {
        return res.status(404).json({ message: "Employee type not found" });
      }
      
      // Verify employee type belongs to user's company
      if (existingEmployeeType.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertEmployeeTypeSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      
      const updatedEmployeeType = await storage.updateEmployeeType(id, validatedData);
      await logActivity(req, "Employee Type Updated", `Employee type "${validatedData.name}" updated`);
      res.json(updatedEmployeeType);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
        });
      }
      res.status(500).json({ message: "Failed to update employee type" });
    }
  });

  // Delete employee type
  app.delete("/api/employee-types/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      
      // Get employee type for activity log
      const employeeType = await storage.getEmployeeType(id);
      if (!employeeType) {
        return res.status(404).json({ message: "Employee type not found" });
      }

      // Verify employee type belongs to user's company
      if (employeeType.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if employee type has employees
      const employees = await storage.getEmployeesByType(id);
      if (employees.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete employee type with employees. Reassign employees first." 
        });
      }

      const success = await storage.deleteEmployeeType(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employee type not found" });
      }

      await logActivity(req, "Employee Type Deleted", `Employee type "${employeeType.name}" deleted`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee type" });
    }
  });
} 