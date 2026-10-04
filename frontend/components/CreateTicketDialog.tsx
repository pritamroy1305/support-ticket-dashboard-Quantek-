"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError, createTicket } from "@/lib/api";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { createTicketFormSchema, type CreateTicketFormValues } from "@/lib/schemas";
import { PRIORITIES, STATUSES } from "@/types/ticket";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Modal } from "./ui/modal";
import { useToast } from "./ui/toast";

interface CreateTicketDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const FORM_FIELDS = ["title", "description", "customerEmail", "priority", "status"] as const;

export function CreateTicketDialog({ onClose, onCreated }: CreateTicketDialogProps) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketFormSchema),
    defaultValues: { title: "", description: "", customerEmail: "", priority: "MEDIUM", status: "OPEN" },
  });

  async function onSubmit(values: CreateTicketFormValues) {
    setFormError(null);
    try {
      await createTicket(values);
      toast("success", "Ticket created successfully.");
      onCreated();
      onClose();
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      // Show backend validation errors next to the matching field
      let mapped = false;
      for (const detail of error.details) {
        const field = FORM_FIELDS.find((name) => name === detail.field);
        if (field) {
          setError(field, { message: detail.message });
          mapped = true;
        }
      }
      setFormError(mapped ? "Please fix the highlighted fields." : error.message);
    }
  }

  return (
    <Modal title="Create Ticket" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </p>
        )}

        <Field label="Title" htmlFor="title" error={errors.title?.message}>
          <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
        </Field>

        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <Textarea id="description" rows={4} aria-invalid={!!errors.description} {...register("description")} />
        </Field>

        <Field label="Customer Email" htmlFor="customerEmail" error={errors.customerEmail?.message}>
          <Input id="customerEmail" type="email" aria-invalid={!!errors.customerEmail} {...register("customerEmail")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority" htmlFor="priority" error={errors.priority?.message}>
            <Select id="priority" {...register("priority")}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="status" error={errors.status?.message}>
            <Select id="status" {...register("status")}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Create Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}
