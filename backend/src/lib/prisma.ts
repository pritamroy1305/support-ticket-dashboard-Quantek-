import "../config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to backend/.env and fill it in.");
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
