import type { Request, Response } from "express";
import * as ticketService from "../services/ticket.service";
import { parseOrThrow } from "../utils/validate";
import {
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdSchema,
  updateTicketSchema,
} from "../validators/ticket.validators";

export async function createTicket(req: Request, res: Response) {
  const input = parseOrThrow(createTicketSchema, req.body ?? {});
  const ticket = await ticketService.createTicket(input);
  res.status(201).json({ success: true, data: ticket });
}

export async function listTickets(req: Request, res: Response) {
  const query = parseOrThrow(listTicketsQuerySchema, req.query);
  const data = await ticketService.listTickets(query);
  res.json({ success: true, data });
}

export async function getTicket(req: Request, res: Response) {
  const id = parseOrThrow(ticketIdSchema, req.params.id);
  const ticket = await ticketService.getTicketById(id);
  res.json({ success: true, data: ticket });
}

export async function updateTicket(req: Request, res: Response) {
  const id = parseOrThrow(ticketIdSchema, req.params.id);
  const input = parseOrThrow(updateTicketSchema, req.body ?? {});
  const ticket = await ticketService.updateTicket(id, input);
  res.json({ success: true, data: ticket });
}

export async function getSummary(_req: Request, res: Response) {
  const summary = await ticketService.getSummary();
  res.json({ success: true, data: summary });
}
