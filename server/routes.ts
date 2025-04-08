import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import {
  User
} from "@shared/schema";
import { setupLeaveTypeRoutes } from "./routes/leave-types";
import { setupLocationRoutes } from "./routes/locations";
import { setupShiftRoutes } from "./routes/shifts";
import { setupAttendanceRoutes } from "./routes/attendance";
import { setupDashboardRoutes } from "./routes/dashboard";
import { setupDepartmentRoutes } from "./routes/departments";
import { setupDesignationRoutes } from "./routes/designations";
import { setupEmployeeTypeRoutes } from "./routes/employee-types";
import { setupEmployeeRoutes } from "./routes/employees";
import { setupLeaveRoutes } from "./routes/leaves";


export function registerRoutes(app: Express): Server {
  // Setup authentication
  setupAuth(app);

  // Register route handlers
  setupDashboardRoutes(app);
  setupDepartmentRoutes(app);
  setupDesignationRoutes(app);
  setupEmployeeTypeRoutes(app);
  setupShiftRoutes(app);
  setupLeaveTypeRoutes(app);
  setupLocationRoutes(app);
  setupEmployeeRoutes(app);
  setupAttendanceRoutes(app);
  setupLeaveRoutes(app);

  // Create HTTP server
  return createServer(app);
}
