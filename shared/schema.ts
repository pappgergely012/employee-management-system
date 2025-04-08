import { pgTable, text, serial, integer, boolean, date, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session schema for express-session
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Companies schema - must be defined first as other tables reference it
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  description: true,
  address: true,
  phone: true,
  email: true,
  website: true,
  logo: true,
});

// Users schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // admin, hr, manager, user
  companyId: integer("company_id").references(() => companies.id),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  companyId: true,
  avatar: true,
});

// Department schema
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  companyId: true,
  description: true,
});

// Designation schema
export const designations = pgTable("designations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  departmentId: integer("department_id").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDesignationSchema = createInsertSchema(designations).pick({
  name: true,
  departmentId: true,
  companyId: true,
  description: true,
});

// Employee Type schema
export const employeeTypes = pgTable("employee_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeTypeSchema = createInsertSchema(employeeTypes).pick({
  name: true,
  companyId: true,
  description: true,
});

// Shift schema
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shifts).pick({
  name: true,
  companyId: true,
  startTime: true,
  endTime: true,
  description: true,
});

// Leave Type schema
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  description: text("description"),
  allowedDays: integer("allowed_days").notNull(),
  isPaid: boolean("is_paid").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeaveTypeSchema = createInsertSchema(leaveTypes).pick({
  name: true,
  companyId: true,
  description: true,
  allowedDays: true,
  isPaid: true,
});

// Location/Branch schema
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  zipCode: text("zip_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  companyId: true,
  address: true,
  city: true,
  state: true,
  country: true,
  zipCode: true,
});

// Employee schema
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  departmentId: integer("department_id").notNull(),
  designationId: integer("designation_id").notNull(),
  employeeTypeId: integer("employee_type_id").notNull(),
  shiftId: integer("shift_id").notNull(),
  locationId: integer("location_id").notNull(),
  dateOfJoining: date("date_of_joining").notNull(),
  dateOfBirth: date("date_of_birth"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  zipCode: text("zip_code"),
  gender: text("gender"),
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  employeeId: true,
  companyId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  departmentId: true,
  designationId: true,
  employeeTypeId: true,
  shiftId: true,
  locationId: true,
  dateOfJoining: true,
  dateOfBirth: true,
  address: true,
  city: true,
  state: true,
  country: true,
  zipCode: true,
  gender: true,
  avatar: true,
  isActive: true,
});

// Attendance schema
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  date: date("date").notNull(),
  status: text("status").notNull(), // present, absent, late, half_day
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  employeeId: true,
  companyId: true,
  date: true,
  status: true,
  checkIn: true,
  checkOut: true,
  remarks: true,
});

// Leave schema
export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  leaveTypeId: integer("leave_type_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeaveSchema = createInsertSchema(leaves).pick({
  employeeId: true,
  companyId: true,
  leaveTypeId: true,
  startDate: true,
  endDate: true,
  reason: true,
  status: true,
  approvedBy: true,
});

// Salary schema
export const salary = pgTable("salary", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  basicSalary: integer("basic_salary").notNull(),
  houseRentAllowance: integer("house_rent_allowance"),
  conveyanceAllowance: integer("conveyance_allowance"),
  medicalAllowance: integer("medical_allowance"),
  specialAllowance: integer("special_allowance"),
  providentFund: integer("provident_fund"),
  incomeTax: integer("income_tax"),
  professionalTax: integer("professional_tax"),
  otherDeductions: integer("other_deductions"),
  netSalary: integer("net_salary").notNull(),
  paymentDate: date("payment_date"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalarySchema = createInsertSchema(salary).pick({
  employeeId: true,
  companyId: true,
  month: true,
  year: true,
  basicSalary: true,
  houseRentAllowance: true,
  conveyanceAllowance: true,
  medicalAllowance: true,
  specialAllowance: true,
  providentFund: true,
  incomeTax: true,
  professionalTax: true,
  otherDeductions: true,
  netSalary: true,
  paymentDate: true,
  paymentStatus: true,
  remarks: true,
});

// Activity Log schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  companyId: true,
  action: true,
  details: true,
});

// Events schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  companyId: integer("company_id").references(() => companies.id),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  startTime: true,
  endTime: true,
  location: true,
  companyId: true,
  createdBy: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Designation = typeof designations.$inferSelect;
export type InsertDesignation = z.infer<typeof insertDesignationSchema>;

export type EmployeeType = typeof employeeTypes.$inferSelect;
export type InsertEmployeeType = z.infer<typeof insertEmployeeTypeSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

export type LeaveType = typeof leaveTypes.$inferSelect;
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;

export type Salary = typeof salary.$inferSelect;
export type InsertSalary = z.infer<typeof insertSalarySchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Add Organizational Chart schema
export const orgChartNodes = pgTable("org_chart_nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: 'set null' }),
  companyId: integer("company_id").references(() => companies.id),
  parentId: integer("parent_id"),
  level: integer("level").notNull(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrgChartNodeSchema = createInsertSchema(orgChartNodes).pick({
  name: true,
  title: true,
  employeeId: true,
  companyId: true,
  parentId: true,
  level: true,
  order: true,
  isActive: true,
});

export type OrgChartNode = typeof orgChartNodes.$inferSelect;
export type InsertOrgChartNode = z.infer<typeof insertOrgChartNodeSchema>;
