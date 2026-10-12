import { z } from "zod";
import { PRIORITIES, STATUSES } from "@/types/ticket";

export const createTicketFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Title must be 120 characters or less."),
  description: z.string().trim().min(1, "Description is required."),
  customerEmail: z.string().trim().min(1, "Customer email is required.").email("Please enter a valid email address."),
  priority: z.enum(PRIORITIES, { errorMap: () => ({ message: "Please choose a priority." }) }),
  status: z.enum(STATUSES, { errorMap: () => ({ message: "Please choose a status." }) }),
});

export type CreateTicketFormValues = z.infer<typeof createTicketFormSchema>;

/*
 * This file contains the form validation schema for creating a new ticket.
 * Before the frontend sends the ticket data to the backend, it checks whether
 * the user has entered valid and complete information, such as a valid title,
 * description, email address, priority, and status.
 */
