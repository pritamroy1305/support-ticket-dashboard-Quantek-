import { defineConfig } from "vitest/config";
import { getTestDatabaseUrl } from "./tests/testDb";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/globalSetup.ts"],
    env: { DATABASE_URL: getTestDatabaseUrl(), NODE_ENV: "test" },
    fileParallelism: false, // test files share one database
    testTimeout: 15000,
    hookTimeout: 60000,
  },
});
