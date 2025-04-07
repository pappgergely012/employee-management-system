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
  events, Event, InsertEvent
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
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Designations
  getDesignation(id: number): Promise<Designation | undefined>;
  getDesignations(): Promise<Designation[]>;
  getDesignationsByDepartment(departmentId: number): Promise<Designation[]>;
  createDesignation(designation: InsertDesignation): Promise<Designation>;
  updateDesignation(id: number, designation: Partial<Designation>): Promise<Designation | undefined>;
  deleteDesignation(id: number): Promise<boolean>;

  // Employee Types
  getEmployeeType(id: number): Promise<EmployeeType | undefined>;
  getEmployeeTypes(): Promise<EmployeeType[]>;
  createEmployeeType(employeeType: InsertEmployeeType): Promise<EmployeeType>;
  updateEmployeeType(id: number, employeeType: Partial<EmployeeType>): Promise<EmployeeType | undefined>;
  deleteEmployeeType(id: number): Promise<boolean>;

  // Shifts
  getShift(id: number): Promise<Shift | undefined>;
  getShifts(): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: Partial<Shift>): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;

  // Leave Types
  getLeaveType(id: number): Promise<LeaveType | undefined>;
  getLeaveTypes(): Promise<LeaveType[]>;
  createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType>;
  updateLeaveType(id: number, leaveType: Partial<LeaveType>): Promise<LeaveType | undefined>;
  deleteLeaveType(id: number): Promise<boolean>;

  // Locations
  getLocation(id: number): Promise<Location | undefined>;
  getLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<Location>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;

  // Employees
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployees(): Promise<Employee[]>;
  getEmployeesByDepartment(departmentId: number): Promise<Employee[]>;
  getEmployeesByLocation(locationId: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Attendance
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByDate(date: Date): Promise<Attendance[]>;
  getAttendanceByEmployee(employeeId: number): Promise<Attendance[]>;
  getAttendanceByEmployeeAndDate(employeeId: number, date: Date): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  // Leaves
  getLeave(id: number): Promise<Leave | undefined>;
  getLeaves(): Promise<Leave[]>;
  getLeavesByEmployee(employeeId: number): Promise<Leave[]>;
  getLeavesByStatus(status: string): Promise<Leave[]>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeave(id: number, leave: Partial<Leave>): Promise<Leave | undefined>;
  deleteLeave(id: number): Promise<boolean>;

  // Salary
  getSalary(id: number): Promise<Salary | undefined>;
  getSalaries(): Promise<Salary[]>;
  getSalariesByEmployee(employeeId: number): Promise<Salary[]>;
  getSalariesByMonth(month: number, year: number): Promise<Salary[]>;
  createSalary(salary: InsertSalary): Promise<Salary>;
  updateSalary(id: number, salary: Partial<Salary>): Promise<Salary | undefined>;
  deleteSalary(id: number): Promise<boolean>;

  // Activity Logs
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogs(): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number): Promise<ActivityLog[]>;
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;

  // Events
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Dashboard
  getDashboardStats(): Promise<{
    totalEmployees: number;
    activeToday: number;
    onLeaveToday: number;
    pendingLeaveRequests: number;
  }>;
  getDepartmentDistribution(): Promise<{ 
    departmentId: number; 
    name: string; 
    count: number; 
    percentage: number;
  }[]>;
  getRecentEmployees(limit: number): Promise<Employee[]>;
  getRecentActivities(limit: number): Promise<ActivityLog[]>;

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

  async getDepartments(): Promise<Department[]> {
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

  async getDesignations(): Promise<Designation[]> {
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

  async getEmployeeTypes(): Promise<EmployeeType[]> {
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

  async getShifts(): Promise<Shift[]> {
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

  async getLeaveTypes(): Promise<LeaveType[]> {
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

  async getLocations(): Promise<Location[]> {
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

  async getEmployees(): Promise<Employee[]> {
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

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    // Format date to compare only the date part
    const dateString = date.toISOString().split('T')[0];
    return db.select().from(attendance).where(sql`date(${attendance.date}) = ${dateString}`);
  }

  async getAttendanceByEmployee(employeeId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.employeeId, employeeId));
  }

  async getAttendanceByEmployeeAndDate(employeeId: number, date: Date): Promise<Attendance | undefined> {
    // Format date to compare only the date part
    const dateString = date.toISOString().split('T')[0];
    const result = await db.select().from(attendance).where(
      and(
        eq(attendance.employeeId, employeeId),
        sql`date(${attendance.date}) = ${dateString}`
      )
    );
    return result[0];
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(attendance).values({
      ...attendanceData,
      date: attendanceData.date,
      status: attendanceData.status,
      employeeId: attendanceData.employeeId,
      checkIn: attendanceData.checkIn,
      checkOut: attendanceData.checkOut,
      remarks: attendanceData.remarks
    }).returning();
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

  async getLeaves(): Promise<Leave[]> {
    return db.select().from(leaves);
  }

  async getLeavesByEmployee(employeeId: number): Promise<Leave[]> {
    return db.select().from(leaves).where(eq(leaves.employeeId, employeeId));
  }

  async getLeavesByStatus(status: string): Promise<Leave[]> {
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

  async getSalaries(): Promise<Salary[]> {
    return db.select().from(salary);
  }

  async getSalariesByEmployee(employeeId: number): Promise<Salary[]> {
    return db.select().from(salary).where(eq(salary.employeeId, employeeId));
  }

  async getSalariesByMonth(month: number, year: number): Promise<Salary[]> {
    return db.select().from(salary).where(
      and(
        eq(salary.month, month),
        eq(salary.year, year)
      )
    );
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

  async getActivityLogs(): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt));
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

  async getEvents(): Promise<Event[]> {
    return db.select().from(events);
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const today = new Date().toISOString().split('T')[0];
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

  // Dashboard methods
  async getDashboardStats(): Promise<{
    totalEmployees: number;
    activeToday: number;
    onLeaveToday: number;
    pendingLeaveRequests: number;
  }> {
    // Total employees
    const employeesResult = await db.select({ count: sql<number>`count(*)` }).from(employees);
    const totalEmployees = employeesResult[0]?.count || 0;

    // Active today (employees with attendance today)
    const today = new Date().toISOString().split('T')[0];
    const activeResult = await db.select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(
        and(
          sql`date(${attendance.date}) = ${today}`,
          eq(attendance.status, 'present')
        )
      );
    const activeToday = activeResult[0]?.count || 0;

    // On leave today
    const todayDate = new Date();
    const leaveResult = await db.select({ count: sql<number>`count(*)` })
      .from(leaves)
      .where(
        and(
          sql`date(${leaves.startDate}) <= ${today}`,
          sql`date(${leaves.endDate}) >= ${today}`,
          eq(leaves.status, 'approved')
        )
      );
    const onLeaveToday = leaveResult[0]?.count || 0;

    // Pending leave requests
    const pendingResult = await db.select({ count: sql<number>`count(*)` })
      .from(leaves)
      .where(eq(leaves.status, 'pending'));
    const pendingLeaveRequests = pendingResult[0]?.count || 0;

    return {
      totalEmployees,
      activeToday,
      onLeaveToday,
      pendingLeaveRequests
    };
  }

  async getDepartmentDistribution(): Promise<{ 
    departmentId: number; 
    name: string; 
    count: number; 
    percentage: number;
  }[]> {
    // Get total employees
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(employees);
    const totalEmployees = totalResult[0]?.count || 0;

    if (totalEmployees === 0) {
      return [];
    }

    // Get department counts
    const departmentCounts = await db.select({
      departmentId: employees.departmentId,
      count: sql<number>`count(*)`
    })
    .from(employees)
    .groupBy(employees.departmentId);

    // Get department names and calculate percentages
    const distribution = await Promise.all(
      departmentCounts.map(async (item) => {
        const department = await this.getDepartment(item.departmentId);
        return {
          departmentId: item.departmentId,
          name: department?.name || 'Unknown',
          count: item.count,
          percentage: Math.round((item.count / totalEmployees) * 100)
        };
      })
    );

    return distribution;
  }

  async getRecentEmployees(limit: number): Promise<Employee[]> {
    return db.select()
      .from(employees)
      .orderBy(desc(employees.createdAt))
      .limit(limit);
  }

  async getRecentActivities(limit: number): Promise<ActivityLog[]> {
    return db.select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();