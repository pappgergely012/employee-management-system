import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isHR, isManager } from "./auth";
import { z } from "zod";
import {
  insertDepartmentSchema,
  insertDesignationSchema,
  insertEmployeeTypeSchema,
  insertShiftSchema,
  insertLeaveTypeSchema,
  insertLocationSchema,
  insertEmployeeSchema,
  insertAttendanceSchema,
  insertLeaveSchema,
  insertSalarySchema,
  insertEventSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Dashboard data
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/department-distribution", isAuthenticated, async (req, res) => {
    try {
      const distribution = await storage.getDepartmentDistribution();
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch department distribution" });
    }
  });

  app.get("/api/dashboard/recent-employees", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const employees = await storage.getRecentEmployees(limit);

      // Fetch associated data for each employee
      const enhancedEmployees = await Promise.all(employees.map(async (employee) => {
        const department = await storage.getDepartment(employee.departmentId);
        const designation = await storage.getDesignation(employee.designationId);
        return {
          ...employee,
          departmentName: department?.name || "Unknown",
          designationName: designation?.name || "Unknown"
        };
      }));

      res.json(enhancedEmployees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent employees" });
    }
  });

  app.get("/api/dashboard/activities", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const activities = await storage.getRecentActivities(limit);

      // Fetch user info for each activity
      const enhancedActivities = await Promise.all(activities.map(async (activity) => {
        const user = await storage.getUser(activity.userId);
        return {
          ...activity,
          username: user?.username || "Unknown",
          userFullName: user?.fullName || "Unknown",
          userAvatar: user?.avatar || ""
        };
      }));

      res.json(enhancedActivities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/dashboard/upcoming-events", isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getUpcomingEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/dashboard/pending-leaves", isAuthenticated, async (req, res) => {
    try {
      const pendingLeaves = await storage.getLeavesByStatus("pending");

      // Fetch employee info for each leave request
      const enhancedLeaves = await Promise.all(pendingLeaves.map(async (leave) => {
        const employee = await storage.getEmployee(leave.employeeId);
        const leaveType = await storage.getLeaveType(leave.leaveTypeId);
        return {
          ...leave,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
          employeeAvatar: employee?.avatar || "",
          leaveTypeName: leaveType?.name || "Unknown"
        };
      }));

      res.json(enhancedLeaves);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending leave requests" });
    }
  });

  // Department routes
  app.get("/api/departments", isAuthenticated, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.get("/api/departments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch department" });
    }
  });

  app.post("/api/departments", isHR, async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const newDepartment = await storage.createDepartment(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Department Created",
        details: `Department "${validatedData.name}" created`
      });

      res.status(201).json(newDepartment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.put("/api/departments/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDepartmentSchema.parse(req.body);
      const updatedDepartment = await storage.updateDepartment(id, validatedData);
      
      if (!updatedDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Department Updated",
        details: `Department "${validatedData.name}" updated`
      });

      res.json(updatedDepartment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get department name for activity log
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
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

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Department Deleted",
        details: `Department "${department.name}" deleted`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // Designation routes
  app.get("/api/designations", isAuthenticated, async (req, res) => {
    try {
      const designations = await storage.getDesignations();
      res.json(designations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch designations" });
    }
  });

  app.get("/api/designations/department/:departmentId", isAuthenticated, async (req, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const designations = await storage.getDesignationsByDepartment(departmentId);
      res.json(designations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch designations by department" });
    }
  });

  app.get("/api/designations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const designation = await storage.getDesignation(id);
      if (!designation) {
        return res.status(404).json({ message: "Designation not found" });
      }
      res.json(designation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch designation" });
    }
  });

  app.post("/api/designations", isHR, async (req, res) => {
    try {
      const validatedData = insertDesignationSchema.parse(req.body);
      
      // Verify department exists
      const department = await storage.getDepartment(validatedData.departmentId);
      if (!department) {
        return res.status(400).json({ message: "Invalid department ID" });
      }

      const newDesignation = await storage.createDesignation(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Designation Created",
        details: `Designation "${validatedData.name}" created for department "${department.name}"`
      });

      res.status(201).json(newDesignation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create designation" });
    }
  });

  app.put("/api/designations/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDesignationSchema.parse(req.body);
      
      // Verify department exists
      const department = await storage.getDepartment(validatedData.departmentId);
      if (!department) {
        return res.status(400).json({ message: "Invalid department ID" });
      }

      const updatedDesignation = await storage.updateDesignation(id, validatedData);
      
      if (!updatedDesignation) {
        return res.status(404).json({ message: "Designation not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Designation Updated",
        details: `Designation "${validatedData.name}" updated`
      });

      res.json(updatedDesignation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update designation" });
    }
  });

  app.delete("/api/designations/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get designation for activity log
      const designation = await storage.getDesignation(id);
      if (!designation) {
        return res.status(404).json({ message: "Designation not found" });
      }

      const success = await storage.deleteDesignation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Designation not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Designation Deleted",
        details: `Designation "${designation.name}" deleted`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete designation" });
    }
  });

  // Employee Type routes
  app.get("/api/employee-types", isAuthenticated, async (req, res) => {
    try {
      const employeeTypes = await storage.getEmployeeTypes();
      res.json(employeeTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee types" });
    }
  });

  app.get("/api/employee-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeType = await storage.getEmployeeType(id);
      if (!employeeType) {
        return res.status(404).json({ message: "Employee type not found" });
      }
      res.json(employeeType);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee type" });
    }
  });

  app.post("/api/employee-types", isHR, async (req, res) => {
    try {
      const validatedData = insertEmployeeTypeSchema.parse(req.body);
      const newEmployeeType = await storage.createEmployeeType(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Employee Type Created",
        details: `Employee type "${validatedData.name}" created`
      });

      res.status(201).json(newEmployeeType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create employee type" });
    }
  });

  app.put("/api/employee-types/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmployeeTypeSchema.parse(req.body);
      const updatedEmployeeType = await storage.updateEmployeeType(id, validatedData);
      
      if (!updatedEmployeeType) {
        return res.status(404).json({ message: "Employee type not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Employee Type Updated",
        details: `Employee type "${validatedData.name}" updated`
      });

      res.json(updatedEmployeeType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update employee type" });
    }
  });

  app.delete("/api/employee-types/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get employee type for activity log
      const employeeType = await storage.getEmployeeType(id);
      if (!employeeType) {
        return res.status(404).json({ message: "Employee type not found" });
      }

      const success = await storage.deleteEmployeeType(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employee type not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Employee Type Deleted",
        details: `Employee type "${employeeType.name}" deleted`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee type" });
    }
  });

  // Shift routes
  app.get("/api/shifts", isAuthenticated, async (req, res) => {
    try {
      const shifts = await storage.getShifts();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get("/api/shifts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shift = await storage.getShift(id);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shift" });
    }
  });

  app.post("/api/shifts", isHR, async (req, res) => {
    try {
      const validatedData = insertShiftSchema.parse(req.body);
      const newShift = await storage.createShift(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Shift Created",
        details: `Shift "${validatedData.name}" created with time ${validatedData.startTime} - ${validatedData.endTime}`
      });

      res.status(201).json(newShift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  app.put("/api/shifts/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertShiftSchema.parse(req.body);
      const updatedShift = await storage.updateShift(id, validatedData);
      
      if (!updatedShift) {
        return res.status(404).json({ message: "Shift not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Shift Updated",
        details: `Shift "${validatedData.name}" updated with time ${validatedData.startTime} - ${validatedData.endTime}`
      });

      res.json(updatedShift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  app.delete("/api/shifts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get shift for activity log
      const shift = await storage.getShift(id);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }

      const success = await storage.deleteShift(id);
      
      if (!success) {
        return res.status(404).json({ message: "Shift not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Shift Deleted",
        details: `Shift "${shift.name}" deleted`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // Leave Type routes
  app.get("/api/leave-types", isAuthenticated, async (req, res) => {
    try {
      const leaveTypes = await storage.getLeaveTypes();
      res.json(leaveTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave types" });
    }
  });

  app.get("/api/leave-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const leaveType = await storage.getLeaveType(id);
      if (!leaveType) {
        return res.status(404).json({ message: "Leave type not found" });
      }
      res.json(leaveType);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave type" });
    }
  });

  app.post("/api/leave-types", isHR, async (req, res) => {
    try {
      const validatedData = insertLeaveTypeSchema.parse(req.body);
      const newLeaveType = await storage.createLeaveType(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Leave Type Created",
        details: `Leave type "${validatedData.name}" created with ${validatedData.allowedDays} days allowed`
      });

      res.status(201).json(newLeaveType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create leave type" });
    }
  });

  app.put("/api/leave-types/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLeaveTypeSchema.parse(req.body);
      const updatedLeaveType = await storage.updateLeaveType(id, validatedData);
      
      if (!updatedLeaveType) {
        return res.status(404).json({ message: "Leave type not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Leave Type Updated",
        details: `Leave type "${validatedData.name}" updated with ${validatedData.allowedDays} days allowed`
      });

      res.json(updatedLeaveType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update leave type" });
    }
  });

  app.delete("/api/leave-types/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get leave type for activity log
      const leaveType = await storage.getLeaveType(id);
      if (!leaveType) {
        return res.status(404).json({ message: "Leave type not found" });
      }

      const success = await storage.deleteLeaveType(id);
      
      if (!success) {
        return res.status(404).json({ message: "Leave type not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Leave Type Deleted",
        details: `Leave type "${leaveType.name}" deleted`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete leave type" });
    }
  });

  // Location/Branch routes
  app.get("/api/locations", isAuthenticated, async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const location = await storage.getLocation(id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  app.post("/api/locations", isHR, async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const newLocation = await storage.createLocation(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Location Created",
        details: `Location "${validatedData.name}" created at ${validatedData.address || "no address"}`
      });

      res.status(201).json(newLocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.put("/api/locations/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLocationSchema.parse(req.body);
      const updatedLocation = await storage.updateLocation(id, validatedData);
      
      if (!updatedLocation) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Location Updated",
        details: `Location "${validatedData.name}" updated at ${validatedData.address || "no address"}`
      });

      res.json(updatedLocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.delete("/api/locations/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get location for activity log
      const location = await storage.getLocation(id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Check if location has employees
      const employees = await storage.getEmployeesByLocation(id);
      if (employees.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete location with employees. Reassign employees first." 
        });
      }

      const success = await storage.deleteLocation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Location Deleted",
        details: `Location "${location.name}" deleted`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Get related data
      const department = await storage.getDepartment(employee.departmentId);
      const designation = await storage.getDesignation(employee.designationId);
      const employeeType = await storage.getEmployeeType(employee.employeeTypeId);
      const shift = await storage.getShift(employee.shiftId);
      const location = await storage.getLocation(employee.locationId);

      res.json({
        ...employee,
        departmentName: department?.name,
        designationName: designation?.name,
        employeeTypeName: employeeType?.name,
        shiftName: shift?.name,
        locationName: location?.name
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isHR, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      // Check if related entities exist
      const department = await storage.getDepartment(validatedData.departmentId);
      if (!department) {
        return res.status(400).json({ message: "Invalid department ID" });
      }
      
      const designation = await storage.getDesignation(validatedData.designationId);
      if (!designation) {
        return res.status(400).json({ message: "Invalid designation ID" });
      }
      
      const employeeType = await storage.getEmployeeType(validatedData.employeeTypeId);
      if (!employeeType) {
        return res.status(400).json({ message: "Invalid employee type ID" });
      }
      
      const shift = await storage.getShift(validatedData.shiftId);
      if (!shift) {
        return res.status(400).json({ message: "Invalid shift ID" });
      }
      
      const location = await storage.getLocation(validatedData.locationId);
      if (!location) {
        return res.status(400).json({ message: "Invalid location ID" });
      }

      const newEmployee = await storage.createEmployee(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Employee Added",
        details: `Employee ${validatedData.firstName} ${validatedData.lastName} added to ${department.name} department`
      });

      res.status(201).json(newEmployee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      // Check if related entities exist
      const department = await storage.getDepartment(validatedData.departmentId);
      if (!department) {
        return res.status(400).json({ message: "Invalid department ID" });
      }
      
      const designation = await storage.getDesignation(validatedData.designationId);
      if (!designation) {
        return res.status(400).json({ message: "Invalid designation ID" });
      }
      
      const employeeType = await storage.getEmployeeType(validatedData.employeeTypeId);
      if (!employeeType) {
        return res.status(400).json({ message: "Invalid employee type ID" });
      }
      
      const shift = await storage.getShift(validatedData.shiftId);
      if (!shift) {
        return res.status(400).json({ message: "Invalid shift ID" });
      }
      
      const location = await storage.getLocation(validatedData.locationId);
      if (!location) {
        return res.status(400).json({ message: "Invalid location ID" });
      }

      const updatedEmployee = await storage.updateEmployee(id, validatedData);
      
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Employee Updated",
        details: `Employee ${validatedData.firstName} ${validatedData.lastName} information updated`
      });

      res.json(updatedEmployee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get employee for activity log
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Employee Deleted",
        details: `Employee ${employee.firstName} ${employee.lastName} deleted`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", isAuthenticated, async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const attendance = await storage.getAttendanceByDate(date);

      // Enhance attendance data with employee information
      const enhancedAttendance = await Promise.all(attendance.map(async (record) => {
        const employee = await storage.getEmployee(record.employeeId);
        return {
          ...record,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
          employeeAvatar: employee?.avatar || "",
          department: employee ? (await storage.getDepartment(employee.departmentId))?.name : "Unknown"
        };
      }));

      res.json(enhancedAttendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/employee/:employeeId", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const attendance = await storage.getAttendanceByEmployee(employeeId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee attendance" });
    }
  });

  app.post("/api/attendance", isManager, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      
      // Check if employee exists
      const employee = await storage.getEmployee(validatedData.employeeId);
      if (!employee) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      // Check for duplicate attendance entry
      const existingAttendance = await storage.getAttendanceByEmployeeAndDate(
        validatedData.employeeId, 
        validatedData.date
      );
      
      if (existingAttendance) {
        return res.status(400).json({ 
          message: "Attendance record already exists for this employee on this date" 
        });
      }

      const newAttendance = await storage.createAttendance(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Attendance Marked",
        details: `Attendance marked as "${validatedData.status}" for ${employee.firstName} ${employee.lastName}`
      });

      res.status(201).json(newAttendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  app.put("/api/attendance/:id", isManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAttendanceSchema.parse(req.body);
      
      // Check if employee exists
      const employee = await storage.getEmployee(validatedData.employeeId);
      if (!employee) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      const updatedAttendance = await storage.updateAttendance(id, validatedData);
      
      if (!updatedAttendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Attendance Updated",
        details: `Attendance updated to "${validatedData.status}" for ${employee.firstName} ${employee.lastName}`
      });

      res.json(updatedAttendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update attendance record" });
    }
  });

  app.delete("/api/attendance/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get attendance record for activity log
      const attendance = await storage.getAttendance(id);
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      const employee = await storage.getEmployee(attendance.employeeId);

      const success = await storage.deleteAttendance(id);
      
      if (!success) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Attendance Deleted",
        details: `Attendance record deleted for ${employee ? `${employee.firstName} ${employee.lastName}` : "unknown employee"}`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attendance record" });
    }
  });

  // Leave routes
  app.get("/api/leaves", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      
      let leaves;
      if (status) {
        leaves = await storage.getLeavesByStatus(status);
      } else {
        leaves = await storage.getLeaves();
      }

      // Enhance leaves data with employee and leave type information
      const enhancedLeaves = await Promise.all(leaves.map(async (leave) => {
        const employee = await storage.getEmployee(leave.employeeId);
        const leaveType = await storage.getLeaveType(leave.leaveTypeId);
        return {
          ...leave,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
          employeeAvatar: employee?.avatar || "",
          department: employee ? (await storage.getDepartment(employee.departmentId))?.name : "Unknown",
          leaveTypeName: leaveType?.name || "Unknown"
        };
      }));

      res.json(enhancedLeaves);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaves" });
    }
  });

  app.get("/api/leaves/employee/:employeeId", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const leaves = await storage.getLeavesByEmployee(employeeId);

      // Enhance leaves data with leave type information
      const enhancedLeaves = await Promise.all(leaves.map(async (leave) => {
        const leaveType = await storage.getLeaveType(leave.leaveTypeId);
        return {
          ...leave,
          leaveTypeName: leaveType?.name || "Unknown",
          leaveTypeIsPaid: leaveType?.isPaid || false
        };
      }));

      res.json(enhancedLeaves);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee leaves" });
    }
  });

  app.post("/api/leaves", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLeaveSchema.parse(req.body);
      
      // Check if employee exists
      const employee = await storage.getEmployee(validatedData.employeeId);
      if (!employee) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      // Check if leave type exists
      const leaveType = await storage.getLeaveType(validatedData.leaveTypeId);
      if (!leaveType) {
        return res.status(400).json({ message: "Invalid leave type ID" });
      }

      // Ensure end date is not before start date
      if (new Date(validatedData.endDate) < new Date(validatedData.startDate)) {
        return res.status(400).json({ 
          message: "End date cannot be earlier than start date" 
        });
      }

      const newLeave = await storage.createLeave(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Leave Applied",
        details: `${employee.firstName} ${employee.lastName} applied for ${leaveType.name}`
      });

      res.status(201).json(newLeave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create leave request" });
    }
  });

  app.put("/api/leaves/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLeaveSchema.parse(req.body);
      
      // Check if employee exists
      const employee = await storage.getEmployee(validatedData.employeeId);
      if (!employee) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      // Check if leave type exists
      const leaveType = await storage.getLeaveType(validatedData.leaveTypeId);
      if (!leaveType) {
        return res.status(400).json({ message: "Invalid leave type ID" });
      }

      // Ensure end date is not before start date
      if (new Date(validatedData.endDate) < new Date(validatedData.startDate)) {
        return res.status(400).json({ 
          message: "End date cannot be earlier than start date" 
        });
      }

      // Get existing leave
      const existingLeave = await storage.getLeave(id);
      if (!existingLeave) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      // Check permissions for updating leave status
      if (existingLeave.status !== validatedData.status) {
        // If trying to change status, only HR and admin can do it
        if (req.user.role !== 'admin' && req.user.role !== 'hr') {
          return res.status(403).json({ 
            message: "You don't have permission to change leave status" 
          });
        }

        // If approving/rejecting, add approver ID
        if (validatedData.status === 'approved' || validatedData.status === 'rejected') {
          validatedData.approvedBy = req.user.id;
        }
      } else if (existingLeave.employeeId !== validatedData.employeeId) {
        // If trying to change employee ID, only HR and admin can do it
        if (req.user.role !== 'admin' && req.user.role !== 'hr') {
          return res.status(403).json({ 
            message: "You don't have permission to change leave employee" 
          });
        }
      }

      const updatedLeave = await storage.updateLeave(id, validatedData);
      
      if (!updatedLeave) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      // Log activity
      let activityDescription = '';
      if (existingLeave.status !== validatedData.status) {
        activityDescription = `Leave request ${validatedData.status} for ${employee.firstName} ${employee.lastName}`;
      } else {
        activityDescription = `Leave request updated for ${employee.firstName} ${employee.lastName}`;
      }

      await storage.createActivityLog({
        userId: req.user.id,
        action: "Leave Updated",
        details: activityDescription
      });

      res.json(updatedLeave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update leave request" });
    }
  });

  app.delete("/api/leaves/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get leave for activity log
      const leave = await storage.getLeave(id);
      if (!leave) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      const employee = await storage.getEmployee(leave.employeeId);

      const success = await storage.deleteLeave(id);
      
      if (!success) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Leave Deleted",
        details: `Leave request deleted for ${employee ? `${employee.firstName} ${employee.lastName}` : "unknown employee"}`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete leave request" });
    }
  });

  // Salary routes
  app.get("/api/salaries", isHR, async (req, res) => {
    try {
      let salaries;
      
      if (req.query.month && req.query.year) {
        const month = parseInt(req.query.month as string);
        const year = parseInt(req.query.year as string);
        salaries = await storage.getSalariesByMonth(month, year);
      } else {
        salaries = await storage.getSalaries();
      }

      // Enhance salary data with employee information
      const enhancedSalaries = await Promise.all(salaries.map(async (salary) => {
        const employee = await storage.getEmployee(salary.employeeId);
        return {
          ...salary,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
          employeeAvatar: employee?.avatar || "",
          department: employee ? (await storage.getDepartment(employee.departmentId))?.name : "Unknown"
        };
      }));

      res.json(enhancedSalaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salaries" });
    }
  });

  app.get("/api/salaries/employee/:employeeId", isHR, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const salaries = await storage.getSalariesByEmployee(employeeId);
      res.json(salaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee salaries" });
    }
  });

  app.post("/api/salaries", isHR, async (req, res) => {
    try {
      const validatedData = insertSalarySchema.parse(req.body);
      
      // Check if employee exists
      const employee = await storage.getEmployee(validatedData.employeeId);
      if (!employee) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      // Check for existing salary entry for the month
      const existingSalaries = await storage.getSalariesByEmployee(validatedData.employeeId);
      const duplicate = existingSalaries.find(
        s => s.month === validatedData.month && s.year === validatedData.year
      );
      
      if (duplicate) {
        return res.status(400).json({ 
          message: "Salary already exists for this employee for the specified month/year" 
        });
      }

      const newSalary = await storage.createSalary(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Salary Created",
        details: `Salary of ${validatedData.netSalary} added for ${employee.firstName} ${employee.lastName} for ${validatedData.month}/${validatedData.year}`
      });

      res.status(201).json(newSalary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create salary record" });
    }
  });

  app.put("/api/salaries/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSalarySchema.parse(req.body);
      
      // Check if employee exists
      const employee = await storage.getEmployee(validatedData.employeeId);
      if (!employee) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      const updatedSalary = await storage.updateSalary(id, validatedData);
      
      if (!updatedSalary) {
        return res.status(404).json({ message: "Salary record not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Salary Updated",
        details: `Salary updated to ${validatedData.netSalary} for ${employee.firstName} ${employee.lastName} for ${validatedData.month}/${validatedData.year}`
      });

      res.json(updatedSalary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update salary record" });
    }
  });

  app.delete("/api/salaries/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get salary for activity log
      const salary = await storage.getSalary(id);
      if (!salary) {
        return res.status(404).json({ message: "Salary record not found" });
      }

      const employee = await storage.getEmployee(salary.employeeId);

      const success = await storage.deleteSalary(id);
      
      if (!success) {
        return res.status(404).json({ message: "Salary record not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Salary Deleted",
        details: `Salary record deleted for ${employee ? `${employee.firstName} ${employee.lastName}` : "unknown employee"} for ${salary.month}/${salary.year}`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete salary record" });
    }
  });

  // Events routes
  app.get("/api/events", isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getEvents();
      
      // Enhance events with creator information
      const enhancedEvents = await Promise.all(events.map(async (event) => {
        const creator = await storage.getUser(event.createdBy);
        return {
          ...event,
          creatorName: creator?.fullName || "Unknown"
        };
      }));
      
      res.json(enhancedEvents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/upcoming", isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getUpcomingEvents();
      
      // Enhance events with creator information
      const enhancedEvents = await Promise.all(events.map(async (event) => {
        const creator = await storage.getUser(event.createdBy);
        return {
          ...event,
          creatorName: creator?.fullName || "Unknown"
        };
      }));
      
      res.json(enhancedEvents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  app.post("/api/events", isHR, async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      validatedData.createdBy = req.user.id;

      // Ensure end date is not before start date
      if (new Date(validatedData.endDate) < new Date(validatedData.startDate)) {
        return res.status(400).json({ 
          message: "End date cannot be earlier than start date" 
        });
      }

      const newEvent = await storage.createEvent(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Event Created",
        details: `New event "${validatedData.title}" created`
      });

      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventSchema.parse(req.body);

      // Ensure end date is not before start date
      if (new Date(validatedData.endDate) < new Date(validatedData.startDate)) {
        return res.status(400).json({ 
          message: "End date cannot be earlier than start date" 
        });
      }

      // Get existing event
      const existingEvent = await storage.getEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Keep the original creator
      validatedData.createdBy = existingEvent.createdBy;

      const updatedEvent = await storage.updateEvent(id, validatedData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Event Updated",
        details: `Event "${validatedData.title}" updated`
      });

      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", isHR, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get event for activity log
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const success = await storage.deleteEvent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Event Deleted",
        details: `Event "${event.title}" deleted`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
