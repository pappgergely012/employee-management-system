import { db } from "../server/db";
import { companies, users, departments, designations, employeeTypes, shifts, leaveTypes, locations, employees, attendance, leaves, salary, activityLogs, events, orgChartNodes } from "../shared/schema";
import { isNull } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Starting company migration...");

    // Step 1: Create a default company
    console.log("Creating default company...");
    const [defaultCompany] = await db
      .insert(companies)
      .values({
        name: "Test Company",
        description: "Default company for existing data",
        email: "test@company.com",
      })
      .returning();

    if (!defaultCompany) {
      throw new Error("Failed to create default company");
    }

    console.log("Default company created with ID:", defaultCompany.id);

    // Step 2: Update users table
    console.log("Updating users table...");
    await db
      .update(users)
      .set({ companyId: defaultCompany.id })
      .where(isNull(users.companyId));

    // Step 3: Update departments table
    console.log("Updating departments table...");
    await db
      .update(departments)
      .set({ companyId: defaultCompany.id })
      .where(isNull(departments.companyId));

    // Step 4: Update designations table
    console.log("Updating designations table...");
    await db
      .update(designations)
      .set({ companyId: defaultCompany.id })
      .where(isNull(designations.companyId));

    // Step 5: Update employeeTypes table
    console.log("Updating employee types table...");
    await db
      .update(employeeTypes)
      .set({ companyId: defaultCompany.id })
      .where(isNull(employeeTypes.companyId));

    // Step 6: Update shifts table
    console.log("Updating shifts table...");
    await db
      .update(shifts)
      .set({ companyId: defaultCompany.id })
      .where(isNull(shifts.companyId));

    // Step 7: Update leaveTypes table
    console.log("Updating leave types table...");
    await db
      .update(leaveTypes)
      .set({ companyId: defaultCompany.id })
      .where(isNull(leaveTypes.companyId));

    // Step 8: Update locations table
    console.log("Updating locations table...");
    await db
      .update(locations)
      .set({ companyId: defaultCompany.id })
      .where(isNull(locations.companyId));

    // Step 9: Update employees table
    console.log("Updating employees table...");
    await db
      .update(employees)
      .set({ companyId: defaultCompany.id })
      .where(isNull(employees.companyId));

    // Step 10: Update attendance table
    console.log("Updating attendance table...");
    await db
      .update(attendance)
      .set({ companyId: defaultCompany.id })
      .where(isNull(attendance.companyId));

    // Step 11: Update leaves table
    console.log("Updating leaves table...");
    await db
      .update(leaves)
      .set({ companyId: defaultCompany.id })
      .where(isNull(leaves.companyId));

    // Step 12: Update salary table
    console.log("Updating salary table...");
    await db
      .update(salary)
      .set({ companyId: defaultCompany.id })
      .where(isNull(salary.companyId));

    // Step 13: Update activityLogs table
    console.log("Updating activity logs table...");
    await db
      .update(activityLogs)
      .set({ companyId: defaultCompany.id })
      .where(isNull(activityLogs.companyId));

    // Step 14: Update events table
    console.log("Updating events table...");
    await db
      .update(events)
      .set({ companyId: defaultCompany.id })
      .where(isNull(events.companyId));

    // Step 15: Update orgChartNodes table
    console.log("Updating org chart nodes table...");
    await db
      .update(orgChartNodes)
      .set({ companyId: defaultCompany.id })
      .where(isNull(orgChartNodes.companyId));

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate(); 