import { execSync } from "node:child_process";
import { getTestDatabaseUrl } from "./testDb";

/** Applies all migrations to the test database before any test file runs. */
export default function setup() {
  const databaseUrl = getTestDatabaseUrl();
  try {
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  } catch {
    throw new Error(
      "Could not migrate the test database. Make sure PostgreSQL is running and the test database exists " +
        '(e.g. createdb support_tickets_test). See "Running Tests" in the README.',
    );
  }
}
