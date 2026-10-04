import { Router } from "express";
import * as controller from "../controllers/ticket.controller";

const router = Router();

router.post("/", controller.createTicket);
router.get("/", controller.listTickets);
// Must be registered before "/:id" or "summary" would be treated as an id.
router.get("/summary", controller.getSummary);
router.get("/:id", controller.getTicket);
router.patch("/:id", controller.updateTicket);

export default router;
