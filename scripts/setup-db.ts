import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  // Create a database connection
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  try {
    console.log('Setting up database...');

    // Create admin user
    console.log('Creating admin user...');
    await db.insert(schema.users).values({
      username: 'admin',
      password: await hashPassword('admin123'),
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      avatar: null,
    }).onConflictDoNothing();

    // Seed departments
    console.log('Creating departments...');
    await db.insert(schema.departments).values([
      { name: 'Engineering', description: 'Software Development Department' },
      { name: 'Sales & Marketing', description: 'Sales and Marketing Department' },
      { name: 'Operations', description: 'Operations Department' },
      { name: 'Finance & HR', description: 'Finance and HR Department' }
    ]).onConflictDoNothing();

    // Seed designations
    console.log('Creating designations...');
    await db.insert(schema.designations).values([
      { name: 'Software Developer', departmentId: 1, description: 'Develops software applications' },
      { name: 'Team Lead', departmentId: 1, description: 'Leads development teams' },
      { name: 'Marketing Specialist', departmentId: 2, description: 'Handles marketing campaigns' },
      { name: 'Sales Representative', departmentId: 2, description: 'Handles sales activities' },
      { name: 'Operations Manager', departmentId: 3, description: 'Manages operations' },
      { name: 'HR Manager', departmentId: 4, description: 'Manages HR activities' },
      { name: 'Accountant', departmentId: 4, description: 'Handles accounting activities' }
    ]).onConflictDoNothing();

    // Seed employee types
    console.log('Creating employee types...');
    await db.insert(schema.employeeTypes).values([
      { name: 'Full-Time', description: 'Regular full-time employee' },
      { name: 'Part-Time', description: 'Part-time employee' },
      { name: 'Contract', description: 'Contractual employee' },
      { name: 'Intern', description: 'Internship' }
    ]).onConflictDoNothing();

    // Seed shifts
    console.log('Creating shifts...');
    await db.insert(schema.shifts).values([
      { name: 'Day Shift', startTime: '09:00', endTime: '18:00', description: 'Regular working hours' },
      { name: 'Night Shift', startTime: '20:00', endTime: '05:00', description: 'Night working hours' },
      { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', description: 'Morning working hours' },
      { name: 'Evening Shift', startTime: '14:00', endTime: '22:00', description: 'Evening working hours' }
    ]).onConflictDoNothing();

    // Seed leave types
    console.log('Creating leave types...');
    await db.insert(schema.leaveTypes).values([
      { name: 'Casual Leave', description: 'Short term leave for personal matters', allowedDays: 12, isPaid: true },
      { name: 'Sick Leave', description: 'Leave for medical reasons', allowedDays: 10, isPaid: true },
      { name: 'Vacation', description: 'Annual vacation leave', allowedDays: 15, isPaid: true },
      { name: 'Unpaid Leave', description: 'Leave without pay', allowedDays: 30, isPaid: false }
    ]).onConflictDoNothing();

    // Seed locations
    console.log('Creating locations...');
    await db.insert(schema.locations).values([
      { name: 'Head Office', address: '123 Main St', city: 'San Francisco', state: 'CA', country: 'USA', zipCode: '94105' },
      { name: 'Branch Office', address: '456 Market St', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' }
    ]).onConflictDoNothing();

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    process.exit(0);
  }
}

main();