import cors from "cors";
import express from "express";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import ticketRoutes from "./routes/ticket.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.frontendOrigins }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });
  app.use("/api/tickets", ticketRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
