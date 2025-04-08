import { 
  users, User, InsertUser, 
  departments, Department, InsertDepartment,
  designations, Designation, InsertDesignation,
  employeeTypes, EmployeeType, InsertEmployeeType, 
  shifts, Shift, InsertShift,
  leaveTypes, LeaveType, InsertLeaveType,
  locations, Location, InsertLocation,
  employees, Employee, InsertEmployee,
  attendance, Attendance, InsertAttendance,
  leaves, Leave, InsertLeave,
  salary, Salary, InsertSalary,
  activityLogs, ActivityLog, InsertActivityLog,
  events, Event, InsertEvent,
  orgChartNodes, OrgChartNode, InsertOrgChartNode
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
const { Pool } = pg;

// Create a pool for the postgres session store
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a postgres session store
const PostgresSessionStore = connectPgSimple(session);

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Departments
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartments(companyId?: number): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Designations
  getDesignation(id: number): Promise<Designation | undefined>;
  getDesignations(companyId?: number): Promise<Designation[]>;
  getDesignationsByDepartment(departmentId: number): Promise<Designation[]>;
  createDesignation(designation: InsertDesignation): Promise<Designation>;
  updateDesignation(id: number, designation: Partial<Designation>): Promise<Designation | undefined>;
  deleteDesignation(id: number): Promise<boolean>;

  // Employee Types
  getEmployeeType(id: number): Promise<EmployeeType | undefined>;
  getEmployeeTypes(companyId?: number): Promise<EmployeeType[]>;
  getEmployeesByType(employeeTypeId: number): Promise<Employee[]>;
  createEmployeeType(employeeType: InsertEmployeeType): Promise<EmployeeType>;
  updateEmployeeType(id: number, employeeType: Partial<EmployeeType>): Promise<EmployeeType | undefined>;
  deleteEmployeeType(id: number): Promise<boolean>;

  // Shifts
  getShift(id: number): Promise<Shift | undefined>;
  getShifts(companyId?: number): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: Partial<Shift>): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;

  // Leave Types
  getLeaveType(id: number): Promise<LeaveType | undefined>;
  getLeaveTypes(companyId?: number): Promise<LeaveType[]>;
  createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType>;
  updateLeaveType(id: number, leaveType: Partial<LeaveType>): Promise<LeaveType | undefined>;
  deleteLeaveType(id: number): Promise<boolean>;

  // Locations
  getLocation(id: number): Promise<Location | undefined>;
  getLocations(companyId?: number): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<Location>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;

  // Employees
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployees(companyId?: number): Promise<Employee[]>;
  getEmployeesByDepartment(departmentId: number): Promise<Employee[]>;
  getEmployeesByLocation(locationId: number): Promise<Employee[]>;
  getEmployeesByType(employeeTypeId: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Attendance
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByDate(date: Date, companyId?: number): Promise<Attendance[]>;
  getAttendanceByEmployee(employeeId: number, companyId?: number): Promise<Attendance[]>;
  getAttendanceByEmployeeAndDate(employeeId: number, date: Date, companyId?: number): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  // Leaves
  getLeave(id: number): Promise<Leave | undefined>;
  getLeaves(companyId?: number): Promise<Leave[]>;
  getLeavesByEmployee(employeeId: number, companyId?: number): Promise<Leave[]>;
  getLeavesByStatus(status: string, companyId?: number): Promise<Leave[]>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeave(id: number, leave: Partial<Leave>): Promise<Leave | undefined>;
  deleteLeave(id: number): Promise<boolean>;

  // Salary
  getSalary(id: number): Promise<Salary | undefined>;
  getSalaries(companyId?: number): Promise<Salary[]>;
  getSalariesByEmployee(employeeId: number, companyId?: number): Promise<Salary[]>;
  getSalariesByMonth(month: number, year: number, companyId?: number): Promise<Salary[]>;
  createSalary(salary: InsertSalary): Promise<Salary>;
  updateSalary(id: number, salary: Partial<Salary>): Promise<Salary | undefined>;
  deleteSalary(id: number): Promise<boolean>;

  // Activity Logs
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogs(companyId?: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number, companyId?: number): Promise<ActivityLog[]>;
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;

  // Events
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(companyId?: number): Promise<Event[]>;
  getUpcomingEvents(companyId?: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Organizational Chart
  getOrgChartNode(id: number): Promise<OrgChartNode | undefined>;
  getOrgChartNodes(companyId?: number): Promise<OrgChartNode[]>;
  getOrgChartNodesByLevel(level: number, companyId?: number): Promise<OrgChartNode[]>;
  getOrgChartNodesByParent(parentId: number | null, companyId?: number): Promise<OrgChartNode[]>;
  createOrgChartNode(node: InsertOrgChartNode): Promise<OrgChartNode>;
  updateOrgChartNode(id: number, node: Partial<OrgChartNode>): Promise<OrgChartNode | undefined>;
  deleteOrgChartNode(id: number): Promise<boolean>;
  moveOrgChartNode(id: number, newParentId: number | null, newOrder: number): Promise<boolean>;
  getFullOrgChart(companyId?: number): Promise<OrgChartNode[]>;

  // Dashboard
  getDashboardStats(companyId?: number): Promise<{
    totalEmployees: number;
    activeToday: number;
    onLeaveToday: number;
    pendingLeaveRequests: number;
  }>;
  getDepartmentDistribution(companyId?: number): Promise<{ 
    departmentId: number; 
    name: string; 
    count: number; 
    percentage: number;
  }[]>;
  getRecentEmployees(limit: number, companyId?: number): Promise<Employee[]>;
  getRecentActivities(limit: number, companyId?: number): Promise<ActivityLog[]>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async getDepartments(companyId?: number): Promise<Department[]> {
    if (companyId) {
      return db.select().from(departments).where(eq(departments.companyId, companyId));
    }
    return db.select().from(departments);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }

  async updateDepartment(id: number, departmentData: Partial<Department>): Promise<Department | undefined> {
    const result = await db.update(departments)
      .set(departmentData)
      .where(eq(departments.id, id))
      .returning();
    return result[0];
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db.delete(departments).where(eq(departments.id, id)).returning();
    return result.length > 0;
  }

  // Designation methods
  async getDesignation(id: number): Promise<Designation | undefined> {
    const result = await db.select().from(designations).where(eq(designations.id, id));
    return result[0];
  }

  async getDesignations(companyId?: number): Promise<Designation[]> {
    if (companyId) {
      return db.select().from(designations).where(eq(designations.companyId, companyId));
    }
    return db.select().from(designations);
  }

  async getDesignationsByDepartment(departmentId: number): Promise<Designation[]> {
    return db.select().from(designations).where(eq(designations.departmentId, departmentId));
  }

  async createDesignation(designation: InsertDesignation): Promise<Designation> {
    const result = await db.insert(designations).values(designation).returning();
    return result[0];
  }

  async updateDesignation(id: number, designationData: Partial<Designation>): Promise<Designation | undefined> {
    const result = await db.update(designations)
      .set(designationData)
      .where(eq(designations.id, id))
      .returning();
    return result[0];
  }

  async deleteDesignation(id: number): Promise<boolean> {
    const result = await db.delete(designations).where(eq(designations.id, id)).returning();
    return result.length > 0;
  }

  // Employee Type methods
  async getEmployeeType(id: number): Promise<EmployeeType | undefined> {
    const result = await db.select().from(employeeTypes).where(eq(employeeTypes.id, id));
    return result[0];
  }

  async getEmployeeTypes(companyId?: number): Promise<EmployeeType[]> {
    if (companyId) {
      return db.select().from(employeeTypes).where(eq(employeeTypes.companyId, companyId));
    }
    return db.select().from(employeeTypes);
  }

  async createEmployeeType(employeeType: InsertEmployeeType): Promise<EmployeeType> {
    const result = await db.insert(employeeTypes).values(employeeType).returning();
    return result[0];
  }

  async updateEmployeeType(id: number, employeeTypeData: Partial<EmployeeType>): Promise<EmployeeType | undefined> {
    const result = await db.update(employeeTypes)
      .set(employeeTypeData)
      .where(eq(employeeTypes.id, id))
      .returning();
    return result[0];
  }

  async deleteEmployeeType(id: number): Promise<boolean> {
    const result = await db.delete(employeeTypes).where(eq(employeeTypes.id, id)).returning();
    return result.length > 0;
  }

  // Shift methods
  async getShift(id: number): Promise<Shift | undefined> {
    const result = await db.select().from(shifts).where(eq(shifts.id, id));
    return result[0];
  }

  async getShifts(companyId?: number): Promise<Shift[]> {
    if (companyId) {
      return db.select().from(shifts).where(eq(shifts.companyId, companyId));
    }
    return db.select().from(shifts);
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const result = await db.insert(shifts).values(shift).returning();
    return result[0];
  }

  async updateShift(id: number, shiftData: Partial<Shift>): Promise<Shift | undefined> {
    const result = await db.update(shifts)
      .set(shiftData)
      .where(eq(shifts.id, id))
      .returning();
    return result[0];
  }

  async deleteShift(id: number): Promise<boolean> {
    const result = await db.delete(shifts).where(eq(shifts.id, id)).returning();
    return result.length > 0;
  }

  // Leave Type methods
  async getLeaveType(id: number): Promise<LeaveType | undefined> {
    const result = await db.select().from(leaveTypes).where(eq(leaveTypes.id, id));
    return result[0];
  }

  async getLeaveTypes(companyId?: number): Promise<LeaveType[]> {
    if (companyId) {
      return db.select().from(leaveTypes).where(eq(leaveTypes.companyId, companyId));
    }
    return db.select().from(leaveTypes);
  }

  async createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType> {
    const result = await db.insert(leaveTypes).values(leaveType).returning();
    return result[0];
  }

  async updateLeaveType(id: number, leaveTypeData: Partial<LeaveType>): Promise<LeaveType | undefined> {
    const result = await db.update(leaveTypes)
      .set(leaveTypeData)
      .where(eq(leaveTypes.id, id))
      .returning();
    return result[0];
  }

  async deleteLeaveType(id: number): Promise<boolean> {
    const result = await db.delete(leaveTypes).where(eq(leaveTypes.id, id)).returning();
    return result.length > 0;
  }

  // Location methods
  async getLocation(id: number): Promise<Location | undefined> {
    const result = await db.select().from(locations).where(eq(locations.id, id));
    return result[0];
  }

  async getLocations(companyId?: number): Promise<Location[]> {
    if (companyId) {
      return db.select().from(locations).where(eq(locations.companyId, companyId));
    }
    return db.select().from(locations);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const result = await db.insert(locations).values(location).returning();
    return result[0];
  }

  async updateLocation(id: number, locationData: Partial<Location>): Promise<Location | undefined> {
    const result = await db.update(locations)
      .set(locationData)
      .where(eq(locations.id, id))
      .returning();
    return result[0];
  }

  async deleteLocation(id: number): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.id, id)).returning();
    return result.length > 0;
  }

  // Employee methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id));
    return result[0];
  }

  async getEmployees(companyId?: number): Promise<Employee[]> {
    if (companyId) {
      return db.select().from(employees).where(eq(employees.companyId, companyId));
    }
    return db.select().from(employees);
  }

  async getEmployeesByDepartment(departmentId: number): Promise<Employee[]> {
    return db.select().from(employees).where(eq(employees.departmentId, departmentId));
  }

  async getEmployeesByLocation(locationId: number): Promise<Employee[]> {
    return db.select().from(employees).where(eq(employees.locationId, locationId));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values(employee).returning();
    return result[0];
  }

  async updateEmployee(id: number, employeeData: Partial<Employee>): Promise<Employee | undefined> {
    const result = await db.update(employees)
      .set(employeeData)
      .where(eq(employees.id, id))
      .returning();
    return result[0];
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id)).returning();
    return result.length > 0;
  }

  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const result = await db.select().from(attendance).where(eq(attendance.id, id));
    return result[0];
  }

  async getAttendanceByDate(date: Date, companyId?: number): Promise<Attendance[]> {
    const dateStr = date.toISOString().split('T')[0];
    if (companyId) {
      return db.select().from(attendance)
        .where(and(
          eq(attendance.date, dateStr),
          eq(attendance.companyId, companyId)
        ));
    }
    return db.select().from(attendance).where(eq(attendance.date, dateStr));
  }

  async getAttendanceByEmployee(employeeId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.employeeId, employeeId));
  }

  async getAttendanceByEmployeeAndDate(employeeId: number, date: Date): Promise<Attendance | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    const result = await db.select()
      .from(attendance)
      .where(and(
        eq(attendance.employeeId, employeeId),
        eq(attendance.date, dateStr)
      ));
    return result[0];
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(attendance).values(attendanceData).returning();
    return result[0];
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const result = await db.update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return result[0];
  }

  async deleteAttendance(id: number): Promise<boolean> {
    const result = await db.delete(attendance).where(eq(attendance.id, id)).returning();
    return result.length > 0;
  }

  // Leave methods
  async getLeave(id: number): Promise<Leave | undefined> {
    const result = await db.select().from(leaves).where(eq(leaves.id, id));
    return result[0];
  }

  async getLeaves(companyId?: number): Promise<Leave[]> {
    if (companyId) {
      return db.select({
        id: leaves.id,
        employeeId: leaves.employeeId,
        companyId: leaves.companyId,
        leaveTypeId: leaves.leaveTypeId,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        reason: leaves.reason,
        status: leaves.status,
        approvedBy: leaves.approvedBy,
        createdAt: leaves.createdAt,
        employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeAvatar: employees.avatar,
        department: departments.name,
        leaveTypeName: leaveTypes.name
      })
      .from(leaves)
      .leftJoin(employees, eq(leaves.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id))
      .where(eq(leaves.companyId, companyId));
    }
    return db.select({
      id: leaves.id,
      employeeId: leaves.employeeId,
      companyId: leaves.companyId,
      leaveTypeId: leaves.leaveTypeId,
      startDate: leaves.startDate,
      endDate: leaves.endDate,
      reason: leaves.reason,
      status: leaves.status,
      approvedBy: leaves.approvedBy,
      createdAt: leaves.createdAt,
      employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
      employeeAvatar: employees.avatar,
      department: departments.name,
      leaveTypeName: leaveTypes.name
    })
    .from(leaves)
    .leftJoin(employees, eq(leaves.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id));
  }

  async getLeavesByEmployee(employeeId: number): Promise<Leave[]> {
    return db.select().from(leaves).where(eq(leaves.employeeId, employeeId));
  }

  async getLeavesByStatus(status: string, companyId?: number): Promise<Leave[]> {
    if (companyId) {
      return db.select().from(leaves)
        .where(and(
          eq(leaves.status, status),
          eq(leaves.companyId, companyId)
        ));
    }
    return db.select().from(leaves).where(eq(leaves.status, status));
  }

  async createLeave(leave: InsertLeave): Promise<Leave> {
    const result = await db.insert(leaves).values(leave).returning();
    return result[0];
  }

  async updateLeave(id: number, leaveData: Partial<Leave>): Promise<Leave | undefined> {
    const result = await db.update(leaves)
      .set(leaveData)
      .where(eq(leaves.id, id))
      .returning();
    return result[0];
  }

  async deleteLeave(id: number): Promise<boolean> {
    const result = await db.delete(leaves).where(eq(leaves.id, id)).returning();
    return result.length > 0;
  }

  // Salary methods
  async getSalary(id: number): Promise<Salary | undefined> {
    const result = await db.select().from(salary).where(eq(salary.id, id));
    return result[0];
  }

  async getSalaries(companyId?: number): Promise<Salary[]> {
    if (companyId) {
      return db.select().from(salary).where(eq(salary.companyId, companyId));
    }
    return db.select().from(salary);
  }

  async getSalariesByEmployee(employeeId: number): Promise<Salary[]> {
    return db.select().from(salary).where(eq(salary.employeeId, employeeId));
  }

  async getSalariesByMonth(month: number, year: number, companyId?: number): Promise<Salary[]> {
    if (companyId) {
      return db.select().from(salary)
        .where(and(
          eq(salary.month, month),
          eq(salary.year, year),
          eq(salary.companyId, companyId)
        ));
    }
    return db.select().from(salary)
      .where(and(
        eq(salary.month, month),
        eq(salary.year, year)
      ));
  }

  async createSalary(salaryData: InsertSalary): Promise<Salary> {
    const result = await db.insert(salary).values(salaryData).returning();
    return result[0];
  }

  async updateSalary(id: number, salaryData: Partial<Salary>): Promise<Salary | undefined> {
    const result = await db.update(salary)
      .set(salaryData)
      .where(eq(salary.id, id))
      .returning();
    return result[0];
  }

  async deleteSalary(id: number): Promise<boolean> {
    const result = await db.delete(salary).where(eq(salary.id, id)).returning();
    return result.length > 0;
  }

  // Activity Log methods
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const result = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return result[0];
  }

  async getActivityLogs(companyId?: number): Promise<ActivityLog[]> {
    if (companyId) {
      return db.select().from(activityLogs).where(eq(activityLogs.companyId, companyId));
    }
    return db.select().from(activityLogs);
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).where(eq(activityLogs.userId, userId));
  }

  async createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values(activityLog).returning();
    return result[0];
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async getEvents(companyId?: number): Promise<Event[]> {
    if (companyId) {
      return db.select().from(events).where(eq(events.companyId, companyId));
    }
    return db.select().from(events);
  }

  async getUpcomingEvents(companyId?: number): Promise<Event[]> {
    const today = new Date().toISOString().split('T')[0];
    if (companyId) {
      return db.select()
        .from(events)
        .where(and(
          sql`date(${events.startDate}) >= ${today}`,
          eq(events.companyId, companyId)
        ))
        .orderBy(events.startDate);
    }
    return db.select()
      .from(events)
      .where(sql`date(${events.startDate}) >= ${today}`)
      .orderBy(events.startDate);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const result = await db.update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  // Organizational Chart methods
  async getOrgChartNode(id: number): Promise<OrgChartNode | undefined> {
    const result = await db.select().from(orgChartNodes).where(eq(orgChartNodes.id, id));
    return result[0];
  }

  async getOrgChartNodes(companyId?: number): Promise<OrgChartNode[]> {
    if (companyId) {
      return db.select().from(orgChartNodes).where(eq(orgChartNodes.companyId, companyId));
    }
    return db.select().from(orgChartNodes);
  }

  async getOrgChartNodesByLevel(level: number, companyId?: number): Promise<OrgChartNode[]> {
    if (companyId) {
      return db.select().from(orgChartNodes)
        .where(and(
          eq(orgChartNodes.level, level),
          eq(orgChartNodes.companyId, companyId)
        ));
    }
    return db.select().from(orgChartNodes).where(eq(orgChartNodes.level, level));
  }

  async getOrgChartNodesByParent(parentId: number | null, companyId?: number): Promise<OrgChartNode[]> {
    if (companyId) {
      if (parentId === null) {
        return db.select().from(orgChartNodes)
          .where(and(
            sql`${orgChartNodes.parentId} IS NULL`,
            eq(orgChartNodes.companyId, companyId)
          ));
      }
      return db.select().from(orgChartNodes)
        .where(and(
          eq(orgChartNodes.parentId, parentId),
          eq(orgChartNodes.companyId, companyId)
        ));
    }
    if (parentId === null) {
      return db.select().from(orgChartNodes).where(sql`${orgChartNodes.parentId} IS NULL`);
    }
    return db.select().from(orgChartNodes).where(eq(orgChartNodes.parentId, parentId));
  }

  async createOrgChartNode(node: InsertOrgChartNode): Promise<OrgChartNode> {
    const result = await db.insert(orgChartNodes).values(node).returning();
    return result[0];
  }

  async updateOrgChartNode(id: number, nodeData: Partial<OrgChartNode>): Promise<OrgChartNode | undefined> {
    const result = await db.update(orgChartNodes)
      .set(nodeData)
      .where(eq(orgChartNodes.id, id))
      .returning();
    return result[0];
  }

  async deleteOrgChartNode(id: number): Promise<boolean> {
    const result = await db.delete(orgChartNodes).where(eq(orgChartNodes.id, id)).returning();
    return result.length > 0;
  }

  async moveOrgChartNode(id: number, newParentId: number | null, newOrder: number): Promise<boolean> {
    const result = await db.update(orgChartNodes)
      .set({
        parentId: newParentId,
        order: newOrder
      })
      .where(eq(orgChartNodes.id, id))
      .returning();
    return result.length > 0;
  }

  async getFullOrgChart(companyId?: number): Promise<OrgChartNode[]> {
    if (companyId) {
      return db.select().from(orgChartNodes)
        .where(eq(orgChartNodes.companyId, companyId))
        .orderBy(orgChartNodes.level, orgChartNodes.order);
    }
    return db.select().from(orgChartNodes)
      .orderBy(orgChartNodes.level, orgChartNodes.order);
  }

  // Dashboard methods
  async getDashboardStats(companyId?: number): Promise<{
    totalEmployees: number;
    activeToday: number;
    onLeaveToday: number;
    pendingLeaveRequests: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const whereClause = companyId ? and(eq(employees.companyId, companyId)) : undefined;
    
    const [totalEmployees] = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(whereClause);

    const [activeToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(and(
        eq(attendance.date, today),
        companyId ? eq(attendance.companyId, companyId) : undefined
      ));

    const [onLeaveToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leaves)
      .where(and(
        sql`${leaves.startDate} <= ${today} AND ${leaves.endDate} >= ${today}`,
        eq(leaves.status, 'approved'),
        companyId ? eq(leaves.companyId, companyId) : undefined
      ));

    const [pendingLeaveRequests] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leaves)
      .where(and(
        eq(leaves.status, 'pending'),
        companyId ? eq(leaves.companyId, companyId) : undefined
      ));

    return {
      totalEmployees: totalEmployees?.count || 0,
      activeToday: activeToday?.count || 0,
      onLeaveToday: onLeaveToday?.count || 0,
      pendingLeaveRequests: pendingLeaveRequests?.count || 0
    };
  }

  async getDepartmentDistribution(companyId?: number): Promise<{ 
    departmentId: number; 
    name: string; 
    count: number; 
    percentage: number;
  }[]> {
    const whereClause = companyId ? and(eq(employees.companyId, companyId)) : undefined;
    
    const totalEmployees = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(whereClause);

    const departmentCounts = await db
      .select({
        departmentId: departments.id,
        name: departments.name,
        count: sql<number>`count(*)`
      })
      .from(employees)
      .innerJoin(departments, eq(employees.departmentId, departments.id))
      .where(whereClause)
      .groupBy(departments.id, departments.name);

    const total = totalEmployees[0]?.count || 0;
    return departmentCounts.map(d => ({
      ...d,
      percentage: total > 0 ? Math.round((d.count / total) * 100) : 0
    }));
  }

  async getRecentEmployees(limit: number, companyId?: number): Promise<Employee[]> {
    const whereClause = companyId ? and(eq(employees.companyId, companyId)) : undefined;
    return db.select()
      .from(employees)
      .where(whereClause)
      .orderBy(desc(employees.dateOfJoining))
      .limit(limit);
  }

  async getRecentActivities(limit: number, companyId?: number): Promise<ActivityLog[]> {
    const whereClause = companyId ? and(eq(activityLogs.companyId, companyId)) : undefined;
    return db.select()
      .from(activityLogs)
      .where(whereClause)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getEmployeesByType(employeeTypeId: number): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.employeeTypeId, employeeTypeId));
  }
}

export const storage = new DatabaseStorage();