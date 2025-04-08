import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAuthenticatedRequest, logActivity } from "../middleware/auth";
import { insertEmployeeSchema } from "@shared/schema";

export function setupEmployeeRoutes(app: Express) {
  // Get all employees
  app.get("/api/employees", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if email query parameter exists
      if (req.query.email) {
        const email = req.query.email as string;
        const employees = await storage.getEmployees(req.user.companyId);
        const employee = employees.find(e => e.email === email);
        
        if (employee) {
          return res.json(employee);
        } else {
          return res.status(404).json({ message: "Employee not found" });
        }
      }
      
      // If no email query, return all employees for the company
      const employees = await storage.getEmployees(req.user.companyId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Get single employee
  app.get("/api/employees/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Verify employee belongs to user's company
      if (employee.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Create employee
  app.post("/api/employees", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const employee = await storage.createEmployee(validatedData);
      await logActivity(req, "CREATE_EMPLOYEE", `Created employee ${employee.firstName} ${employee.lastName}`);
      res.status(201).json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Update employee
  app.put("/api/employees/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Verify employee belongs to user's company
      if (employee.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const updatedEmployee = await storage.updateEmployee(id, validatedData);
      await logActivity(req, "UPDATE_EMPLOYEE", `Updated employee ${updatedEmployee.firstName} ${updatedEmployee.lastName}`);
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Delete employee
  app.delete("/api/employees/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Verify employee belongs to user's company
      if (employee.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteEmployee(id);
      await logActivity(req, "DELETE_EMPLOYEE", `Deleted employee ${employee.firstName} ${employee.lastName}`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });
} 