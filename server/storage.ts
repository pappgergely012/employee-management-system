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
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.MemoryStore;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private departmentsData: Map<number, Department>;
  private designationsData: Map<number, Designation>;
  private employeeTypesData: Map<number, EmployeeType>;
  private shiftsData: Map<number, Shift>;
  private leaveTypesData: Map<number, LeaveType>;
  private locationsData: Map<number, Location>;
  private employeesData: Map<number, Employee>;
  private attendanceData: Map<number, Attendance>;
  private leavesData: Map<number, Leave>;
  private salaryData: Map<number, Salary>;
  private activityLogsData: Map<number, ActivityLog>;
  private eventsData: Map<number, Event>;

  private userIdCounter: number = 1;
  private departmentIdCounter: number = 1;
  private designationIdCounter: number = 1;
  private employeeTypeIdCounter: number = 1;
  private shiftIdCounter: number = 1;
  private leaveTypeIdCounter: number = 1;
  private locationIdCounter: number = 1;
  private employeeIdCounter: number = 1;
  private attendanceIdCounter: number = 1;
  private leaveIdCounter: number = 1;
  private salaryIdCounter: number = 1;
  private activityLogIdCounter: number = 1;
  private eventIdCounter: number = 1;

  sessionStore: session.MemoryStore;

  constructor() {
    this.usersData = new Map();
    this.departmentsData = new Map();
    this.designationsData = new Map();
    this.employeeTypesData = new Map();
    this.shiftsData = new Map();
    this.leaveTypesData = new Map();
    this.locationsData = new Map();
    this.employeesData = new Map();
    this.attendanceData = new Map();
    this.leavesData = new Map();
    this.salaryData = new Map();
    this.activityLogsData = new Map();
    this.eventsData = new Map();

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Initialize some seed data
    this.seedData();
  }

  // Seed Method to add initial data
  private seedData() {
    // Add a default admin user
    this.createUser({
      username: "admin",
      password: "admin123", // This will be hashed by auth.ts
      fullName: "Admin User",
      email: "admin@example.com",
      role: "admin",
      avatar: ""
    });

    // Add some departments
    const engineering = this.createDepartment({ name: "Engineering", description: "Software Development Department" });
    const marketing = this.createDepartment({ name: "Sales & Marketing", description: "Sales and Marketing Department" });
    const operations = this.createDepartment({ name: "Operations", description: "Operations Department" });
    const finance = this.createDepartment({ name: "Finance & HR", description: "Finance and HR Department" });

    // Add some designations
    this.createDesignation({ name: "Software Developer", departmentId: 1, description: "Develops software applications" });
    this.createDesignation({ name: "Team Lead", departmentId: 1, description: "Leads development teams" });
    this.createDesignation({ name: "Marketing Specialist", departmentId: 2, description: "Handles marketing campaigns" });
    this.createDesignation({ name: "Sales Representative", departmentId: 2, description: "Handles sales activities" });
    this.createDesignation({ name: "Operations Manager", departmentId: 3, description: "Manages operations" });
    this.createDesignation({ name: "HR Manager", departmentId: 4, description: "Manages HR activities" });
    this.createDesignation({ name: "Accountant", departmentId: 4, description: "Handles accounting activities" });

    // Add employee types
    this.createEmployeeType({ name: "Full-Time", description: "Regular full-time employee" });
    this.createEmployeeType({ name: "Part-Time", description: "Part-time employee" });
    this.createEmployeeType({ name: "Contract", description: "Contractual employee" });
    this.createEmployeeType({ name: "Intern", description: "Internship" });

    // Add shifts
    this.createShift({ name: "Day Shift", startTime: "09:00", endTime: "18:00", description: "Regular working hours" });
    this.createShift({ name: "Night Shift", startTime: "20:00", endTime: "05:00", description: "Night working hours" });
    this.createShift({ name: "Morning Shift", startTime: "06:00", endTime: "14:00", description: "Morning working hours" });
    this.createShift({ name: "Evening Shift", startTime: "14:00", endTime: "22:00", description: "Evening working hours" });

    // Add leave types
    this.createLeaveType({ name: "Casual Leave", description: "Short term leave for personal matters", allowedDays: 12, isPaid: true });
    this.createLeaveType({ name: "Sick Leave", description: "Leave for medical reasons", allowedDays: 10, isPaid: true });
    this.createLeaveType({ name: "Vacation", description: "Annual vacation leave", allowedDays: 15, isPaid: true });
    this.createLeaveType({ name: "Unpaid Leave", description: "Leave without pay", allowedDays: 30, isPaid: false });

    // Add locations
    this.createLocation({ name: "Head Office", address: "123 Main St", city: "San Francisco", state: "CA", country: "USA", zipCode: "94105" });
    this.createLocation({ name: "Branch Office", address: "456 Market St", city: "New York", state: "NY", country: "USA", zipCode: "10001" });

    // Add some sample employees
    const today = new Date();
    const employee1 = this.createEmployee({
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "1234567890",
      departmentId: 1,
      designationId: 1,
      employeeTypeId: 1,
      shiftId: 1,
      locationId: 1,
      dateOfJoining: new Date(today.setDate(today.getDate() - 2)),
      dateOfBirth: new Date("1990-01-01"),
      address: "123 Employee St",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      zipCode: "94105",
      gender: "Male",
      avatar: "",
      isActive: true
    });

    const employee2 = this.createEmployee({
      employeeId: "EMP002",
      firstName: "Sarah",
      lastName: "Williams",
      email: "sarah.w@example.com",
      phone: "2345678901",
      departmentId: 2,
      designationId: 3,
      employeeTypeId: 1,
      shiftId: 1,
      locationId: 1,
      dateOfJoining: new Date(today.setDate(today.getDate() - 7)),
      dateOfBirth: new Date("1992-05-15"),
      address: "456 Employee Ave",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10001",
      gender: "Female",
      avatar: "",
      isActive: true
    });

    const employee3 = this.createEmployee({
      employeeId: "EMP003",
      firstName: "Mike",
      lastName: "Johnson",
      email: "mike.j@example.com",
      phone: "3456789012",
      departmentId: 3,
      designationId: 5,
      employeeTypeId: 1,
      shiftId: 1,
      locationId: 1,
      dateOfJoining: new Date(today.setDate(today.getDate() - 20)),
      dateOfBirth: new Date("1988-08-22"),
      address: "789 Employee Blvd",
      city: "Chicago",
      state: "IL",
      country: "USA",
      zipCode: "60611",
      gender: "Male",
      avatar: "",
      isActive: true
    });

    // Add some attendance records for today
    const currentDate = new Date();
    this.createAttendance({
      employeeId: 1,
      date: currentDate,
      status: "present",
      checkIn: new Date(currentDate.setHours(9, 0, 0)),
      checkOut: new Date(currentDate.setHours(18, 0, 0)),
      remarks: ""
    });

    this.createAttendance({
      employeeId: 2,
      date: currentDate,
      status: "present",
      checkIn: new Date(currentDate.setHours(9, 0, 0)),
      checkOut: new Date(currentDate.setHours(18, 0, 0)),
      remarks: ""
    });

    // Add some leave requests
    const leaveStartDate = new Date();
    leaveStartDate.setDate(leaveStartDate.getDate() + 3);
    const leaveEndDate = new Date(leaveStartDate);
    leaveEndDate.setDate(leaveEndDate.getDate() + 2);

    this.createLeave({
      employeeId: 1,
      leaveTypeId: 1,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: "Personal matter",
      status: "pending",
      approvedBy: undefined
    });

    // Add some activity logs
    this.createActivityLog({
      userId: 1,
      action: "New employee added",
      details: "Added employee John Doe to Engineering department"
    });

    this.createActivityLog({
      userId: 1,
      action: "Leave approved",
      details: "Approved leave request for Sarah Williams"
    });

    // Add some upcoming events
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 5);
    
    this.createEvent({
      title: "Company Town Hall Meeting",
      description: "Quarterly town hall meeting for all employees",
      startDate: eventDate,
      endDate: eventDate,
      startTime: "10:00",
      endTime: "11:30",
      location: "Main Conference Room",
      createdBy: 1
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { id, ...insertUser, createdAt };
    this.usersData.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersData.delete(id);
  }

  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departmentsData.get(id);
  }

  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departmentsData.values());
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.departmentIdCounter++;
    const createdAt = new Date();
    const department: Department = { id, ...insertDepartment, createdAt };
    this.departmentsData.set(id, department);
    return department;
  }

  async updateDepartment(id: number, departmentData: Partial<Department>): Promise<Department | undefined> {
    const department = this.departmentsData.get(id);
    if (!department) return undefined;
    
    const updatedDepartment = { ...department, ...departmentData };
    this.departmentsData.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    return this.departmentsData.delete(id);
  }

  // Designation methods
  async getDesignation(id: number): Promise<Designation | undefined> {
    return this.designationsData.get(id);
  }

  async getDesignations(): Promise<Designation[]> {
    return Array.from(this.designationsData.values());
  }

  async getDesignationsByDepartment(departmentId: number): Promise<Designation[]> {
    return Array.from(this.designationsData.values()).filter(
      (designation) => designation.departmentId === departmentId
    );
  }

  async createDesignation(insertDesignation: InsertDesignation): Promise<Designation> {
    const id = this.designationIdCounter++;
    const createdAt = new Date();
    const designation: Designation = { id, ...insertDesignation, createdAt };
    this.designationsData.set(id, designation);
    return designation;
  }

  async updateDesignation(id: number, designationData: Partial<Designation>): Promise<Designation | undefined> {
    const designation = this.designationsData.get(id);
    if (!designation) return undefined;
    
    const updatedDesignation = { ...designation, ...designationData };
    this.designationsData.set(id, updatedDesignation);
    return updatedDesignation;
  }

  async deleteDesignation(id: number): Promise<boolean> {
    return this.designationsData.delete(id);
  }

  // Employee Type methods
  async getEmployeeType(id: number): Promise<EmployeeType | undefined> {
    return this.employeeTypesData.get(id);
  }

  async getEmployeeTypes(): Promise<EmployeeType[]> {
    return Array.from(this.employeeTypesData.values());
  }

  async createEmployeeType(insertEmployeeType: InsertEmployeeType): Promise<EmployeeType> {
    const id = this.employeeTypeIdCounter++;
    const createdAt = new Date();
    const employeeType: EmployeeType = { id, ...insertEmployeeType, createdAt };
    this.employeeTypesData.set(id, employeeType);
    return employeeType;
  }

  async updateEmployeeType(id: number, employeeTypeData: Partial<EmployeeType>): Promise<EmployeeType | undefined> {
    const employeeType = this.employeeTypesData.get(id);
    if (!employeeType) return undefined;
    
    const updatedEmployeeType = { ...employeeType, ...employeeTypeData };
    this.employeeTypesData.set(id, updatedEmployeeType);
    return updatedEmployeeType;
  }

  async deleteEmployeeType(id: number): Promise<boolean> {
    return this.employeeTypesData.delete(id);
  }

  // Shift methods
  async getShift(id: number): Promise<Shift | undefined> {
    return this.shiftsData.get(id);
  }

  async getShifts(): Promise<Shift[]> {
    return Array.from(this.shiftsData.values());
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const id = this.shiftIdCounter++;
    const createdAt = new Date();
    const shift: Shift = { id, ...insertShift, createdAt };
    this.shiftsData.set(id, shift);
    return shift;
  }

  async updateShift(id: number, shiftData: Partial<Shift>): Promise<Shift | undefined> {
    const shift = this.shiftsData.get(id);
    if (!shift) return undefined;
    
    const updatedShift = { ...shift, ...shiftData };
    this.shiftsData.set(id, updatedShift);
    return updatedShift;
  }

  async deleteShift(id: number): Promise<boolean> {
    return this.shiftsData.delete(id);
  }

  // Leave Type methods
  async getLeaveType(id: number): Promise<LeaveType | undefined> {
    return this.leaveTypesData.get(id);
  }

  async getLeaveTypes(): Promise<LeaveType[]> {
    return Array.from(this.leaveTypesData.values());
  }

  async createLeaveType(insertLeaveType: InsertLeaveType): Promise<LeaveType> {
    const id = this.leaveTypeIdCounter++;
    const createdAt = new Date();
    const leaveType: LeaveType = { id, ...insertLeaveType, createdAt };
    this.leaveTypesData.set(id, leaveType);
    return leaveType;
  }

  async updateLeaveType(id: number, leaveTypeData: Partial<LeaveType>): Promise<LeaveType | undefined> {
    const leaveType = this.leaveTypesData.get(id);
    if (!leaveType) return undefined;
    
    const updatedLeaveType = { ...leaveType, ...leaveTypeData };
    this.leaveTypesData.set(id, updatedLeaveType);
    return updatedLeaveType;
  }

  async deleteLeaveType(id: number): Promise<boolean> {
    return this.leaveTypesData.delete(id);
  }

  // Location methods
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locationsData.get(id);
  }

  async getLocations(): Promise<Location[]> {
    return Array.from(this.locationsData.values());
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.locationIdCounter++;
    const createdAt = new Date();
    const location: Location = { id, ...insertLocation, createdAt };
    this.locationsData.set(id, location);
    return location;
  }

  async updateLocation(id: number, locationData: Partial<Location>): Promise<Location | undefined> {
    const location = this.locationsData.get(id);
    if (!location) return undefined;
    
    const updatedLocation = { ...location, ...locationData };
    this.locationsData.set(id, updatedLocation);
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<boolean> {
    return this.locationsData.delete(id);
  }

  // Employee methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employeesData.get(id);
  }

  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employeesData.values());
  }

  async getEmployeesByDepartment(departmentId: number): Promise<Employee[]> {
    return Array.from(this.employeesData.values()).filter(
      (employee) => employee.departmentId === departmentId
    );
  }

  async getEmployeesByLocation(locationId: number): Promise<Employee[]> {
    return Array.from(this.employeesData.values()).filter(
      (employee) => employee.locationId === locationId
    );
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.employeeIdCounter++;
    const createdAt = new Date();
    const employee: Employee = { id, ...insertEmployee, createdAt };
    this.employeesData.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, employeeData: Partial<Employee>): Promise<Employee | undefined> {
    const employee = this.employeesData.get(id);
    if (!employee) return undefined;
    
    const updatedEmployee = { ...employee, ...employeeData };
    this.employeesData.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employeesData.delete(id);
  }

  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendanceData.get(id);
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.attendanceData.values()).filter(
      (attendance) => attendance.date.toISOString().split('T')[0] === dateString
    );
  }

  async getAttendanceByEmployee(employeeId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceData.values()).filter(
      (attendance) => attendance.employeeId === employeeId
    );
  }

  async getAttendanceByEmployeeAndDate(employeeId: number, date: Date): Promise<Attendance | undefined> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.attendanceData.values()).find(
      (attendance) => 
        attendance.employeeId === employeeId && 
        attendance.date.toISOString().split('T')[0] === dateString
    );
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceIdCounter++;
    const createdAt = new Date();
    const attendance: Attendance = { id, ...insertAttendance, createdAt };
    this.attendanceData.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const attendance = this.attendanceData.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...attendanceData };
    this.attendanceData.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async deleteAttendance(id: number): Promise<boolean> {
    return this.attendanceData.delete(id);
  }

  // Leave methods
  async getLeave(id: number): Promise<Leave | undefined> {
    return this.leavesData.get(id);
  }

  async getLeaves(): Promise<Leave[]> {
    return Array.from(this.leavesData.values());
  }

  async getLeavesByEmployee(employeeId: number): Promise<Leave[]> {
    return Array.from(this.leavesData.values()).filter(
      (leave) => leave.employeeId === employeeId
    );
  }

  async getLeavesByStatus(status: string): Promise<Leave[]> {
    return Array.from(this.leavesData.values()).filter(
      (leave) => leave.status === status
    );
  }

  async createLeave(insertLeave: InsertLeave): Promise<Leave> {
    const id = this.leaveIdCounter++;
    const createdAt = new Date();
    const leave: Leave = { id, ...insertLeave, createdAt };
    this.leavesData.set(id, leave);
    return leave;
  }

  async updateLeave(id: number, leaveData: Partial<Leave>): Promise<Leave | undefined> {
    const leave = this.leavesData.get(id);
    if (!leave) return undefined;
    
    const updatedLeave = { ...leave, ...leaveData };
    this.leavesData.set(id, updatedLeave);
    return updatedLeave;
  }

  async deleteLeave(id: number): Promise<boolean> {
    return this.leavesData.delete(id);
  }

  // Salary methods
  async getSalary(id: number): Promise<Salary | undefined> {
    return this.salaryData.get(id);
  }

  async getSalaries(): Promise<Salary[]> {
    return Array.from(this.salaryData.values());
  }

  async getSalariesByEmployee(employeeId: number): Promise<Salary[]> {
    return Array.from(this.salaryData.values()).filter(
      (salary) => salary.employeeId === employeeId
    );
  }

  async getSalariesByMonth(month: number, year: number): Promise<Salary[]> {
    return Array.from(this.salaryData.values()).filter(
      (salary) => salary.month === month && salary.year === year
    );
  }

  async createSalary(insertSalary: InsertSalary): Promise<Salary> {
    const id = this.salaryIdCounter++;
    const createdAt = new Date();
    const salary: Salary = { id, ...insertSalary, createdAt };
    this.salaryData.set(id, salary);
    return salary;
  }

  async updateSalary(id: number, salaryData: Partial<Salary>): Promise<Salary | undefined> {
    const salary = this.salaryData.get(id);
    if (!salary) return undefined;
    
    const updatedSalary = { ...salary, ...salaryData };
    this.salaryData.set(id, updatedSalary);
    return updatedSalary;
  }

  async deleteSalary(id: number): Promise<boolean> {
    return this.salaryData.delete(id);
  }

  // Activity Log methods
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return this.activityLogsData.get(id);
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsData.values());
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsData.values()).filter(
      (log) => log.userId === userId
    );
  }

  async createActivityLog(insertActivityLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const createdAt = new Date();
    const activityLog: ActivityLog = { id, ...insertActivityLog, createdAt };
    this.activityLogsData.set(id, activityLog);
    return activityLog;
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.eventsData.get(id);
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.eventsData.values());
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.eventsData.values()).filter(
      (event) => new Date(event.startDate) >= today
    ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const createdAt = new Date();
    const event: Event = { id, ...insertEvent, createdAt };
    this.eventsData.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.eventsData.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.eventsData.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.eventsData.delete(id);
  }

  // Dashboard methods
  async getDashboardStats(): Promise<{
    totalEmployees: number;
    activeToday: number;
    onLeaveToday: number;
    pendingLeaveRequests: number;
  }> {
    const totalEmployees = this.employeesData.size;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    
    const activeToday = Array.from(this.attendanceData.values()).filter(
      (attendance) => 
        attendance.date.toISOString().split('T')[0] === todayString &&
        attendance.status === 'present'
    ).length;
    
    const onLeaveToday = Array.from(this.leavesData.values()).filter(
      (leave) => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        return (
          leave.status === 'approved' &&
          startDate <= today &&
          endDate >= today
        );
      }
    ).length;
    
    const pendingLeaveRequests = Array.from(this.leavesData.values()).filter(
      (leave) => leave.status === 'pending'
    ).length;
    
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
    const departments = await this.getDepartments();
    const totalEmployees = this.employeesData.size;
    
    if (totalEmployees === 0) {
      return departments.map(dept => ({
        departmentId: dept.id,
        name: dept.name,
        count: 0,
        percentage: 0
      }));
    }
    
    const distribution = await Promise.all(departments.map(async (dept) => {
      const employees = await this.getEmployeesByDepartment(dept.id);
      const count = employees.length;
      const percentage = Math.round((count / totalEmployees) * 100);
      
      return {
        departmentId: dept.id,
        name: dept.name,
        count,
        percentage
      };
    }));
    
    return distribution.sort((a, b) => b.count - a.count);
  }

  async getRecentEmployees(limit: number): Promise<Employee[]> {
    return Array.from(this.employeesData.values())
      .sort((a, b) => new Date(b.dateOfJoining).getTime() - new Date(a.dateOfJoining).getTime())
      .slice(0, limit);
  }

  async getRecentActivities(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsData.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
