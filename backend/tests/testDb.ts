import dotenv from "dotenv";

dotenv.config();

/**
 * Tests run against a dedicated database and never touch development data.
 * Safety rules: the name must end with "_test" and must differ from DATABASE_URL.
 */
export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/support_tickets_test";
  const dbName = new URL(url).pathname.replace(/^\//, "");

  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to run tests: database "${dbName}" must end with "_test".`);
  }
  if (url === process.env.DATABASE_URL) {
    throw new Error("Refusing to run tests: TEST_DATABASE_URL must differ from DATABASE_URL.");
  }
  return url;
}
