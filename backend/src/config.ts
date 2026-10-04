import "dotenv/config";

export const config = {
  // Hosting platforms (Render, Railway, ...) provide PORT; locally BACKEND_PORT is used.
  port: Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 4000),
  // One or more allowed browser origins, comma separated.
  frontendOrigins: (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
};