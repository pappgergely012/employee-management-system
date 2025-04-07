import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Get the connection string from environment variables
const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);

// Create the database instance with the schema
export const db = drizzle(sql, { schema });