import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../auth";
import { setupDashboardRoutes } from "./dashboard";
import { setupEmployeeRoutes } from "./employees";
import { setupDepartmentRoutes } from "./departments";
import { setupDesignationRoutes } from "./designations";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Set up routes
  setupDashboardRoutes(app);
  setupDepartmentRoutes(app);
  setupDesignationRoutes(app);
  setupEmployeeRoutes(app);

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
} 