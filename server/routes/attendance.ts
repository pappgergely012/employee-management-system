import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAuthenticatedRequest, logActivity } from "../middleware/auth";
import { insertAttendanceSchema } from "@shared/schema";

export function setupAttendanceRoutes(app: Express) {
  // Get all attendance records
  app.get("/api/attendance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const attendance = await storage.getAttendance(req.user.companyId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  // Get attendance for a specific employee
  app.get("/api/attendance/employee/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const employeeId = parseInt(req.params.id);
      const attendance = await storage.getEmployeeAttendance(employeeId, req.user.companyId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee attendance" });
    }
  });

  // Create attendance record
  app.post("/api/attendance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertAttendanceSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const attendance = await storage.createAttendance(validatedData);
      await logActivity(req, "CREATE_ATTENDANCE", `Created attendance record for employee ${attendance.employeeId}`);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  // Update attendance record
  app.put("/api/attendance/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const attendance = await storage.getAttendanceById(id);
      
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      // Verify attendance belongs to user's company
      if (attendance.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertAttendanceSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const updatedAttendance = await storage.updateAttendance(id, validatedData);
      await logActivity(req, "UPDATE_ATTENDANCE", `Updated attendance record ${id}`);
      res.json(updatedAttendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendance record" });
    }
  });

  // Delete attendance record
  app.delete("/api/attendance/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const attendance = await storage.getAttendanceById(id);
      
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      // Verify attendance belongs to user's company
      if (attendance.companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteAttendance(id);
      await logActivity(req, "DELETE_ATTENDANCE", `Deleted attendance record ${id}`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attendance record" });
    }
  });
} 