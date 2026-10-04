import { z } from "zod";

const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"], {
  errorMap: () => ({ message: "Priority must be one of LOW, MEDIUM, HIGH" }),
});
const statusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"], {
  errorMap: () => ({ message: "Status must be one of OPEN, IN_PROGRESS, RESOLVED" }),
});

export const createTicketSchema = z.object({
  title: z
    .string({ required_error: "Title is required", invalid_type_error: "Title must be a string" })
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be 120 characters or less"),
  description: z
    .string({ required_error: "Description is required", invalid_type_error: "Description must be a string" })
    .trim()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or less"),
  customerEmail: z
    .string({ required_error: "Customer email is required", invalid_type_error: "Customer email must be a string" })
    .trim()
    .min(1, "Customer email is required")
    .max(254, "Customer email is too long")
    .email("Invalid email address"),
  priority: priorityEnum,
  status: statusEnum.default("OPEN"),
});

export const updateTicketSchema = z
  .object({
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
  })
  .strict()
  .refine((value) => value.status !== undefined || value.priority !== undefined, {
    message: "Provide at least one of status or priority",
  });

export const ticketIdSchema = z.string().uuid("Invalid ticket id");

// Query strings like `?status=` (empty) are treated as "not provided".
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const listTicketsQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100, "Search must be 100 characters or less").optional()),
  status: z.preprocess(emptyToUndefined, statusEnum.optional()),
  priority: z.preprocess(emptyToUndefined, priorityEnum.optional()),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["newest", "oldest"], { errorMap: () => ({ message: "Sort must be newest or oldest" }) }).default("newest"),
  ),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int("Page must be an integer").min(1, "Page must be at least 1").default(1)),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int("Limit must be an integer").min(1, "Limit must be at least 1").max(50, "Limit must be 50 or less").default(10),
  ),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
