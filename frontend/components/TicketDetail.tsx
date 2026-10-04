"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { ApiError, getTicket, updateTicket } from "@/lib/api";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { PRIORITIES, STATUSES, type Priority, type Status, type Ticket } from "@/types/ticket";
import { PriorityBadge, StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { ErrorState, Spinner } from "./ui/feedback";
import { Field, Select } from "./ui/field";
import { useToast } from "./ui/toast";

function BackLink() {
  return (
    <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to dashboard
    </Link>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export function TicketDetail({ id }: { id: string }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync((signal) => getTicket(id, signal), [id]);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [status, setStatus] = useState<Status>("OPEN");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync local edit state whenever the ticket is (re)loaded from the backend
  useEffect(() => {
    if (data) {
      setTicket(data);
      setStatus(data.status);
      setPriority(data.priority);
    }
  }, [data]);

  async function handleSave() {
    if (!ticket) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateTicket(ticket.id, { status, priority });
      setTicket(updated);
      setStatus(updated.status);
      setPriority(updated.priority);
      toast("success", "Changes saved.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to save changes.";
      setSaveError(message);
      toast("error", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <BackLink />

      {loading && !ticket ? (
        <Spinner label="Loading ticket..." />
      ) : error && !ticket ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <ErrorState
            message={error.status === 404 || error.status === 400 ? "Ticket not found." : "Unable to load ticket."}
            detail={error.status === 404 || error.status === 400 ? "It may have been removed or the link is incorrect." : error.message}
            onRetry={error.status === 404 || error.status === 400 ? undefined : reload}
          />
        </div>
      ) : ticket ? (
        <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <header className="space-y-3">
            <h1 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">{ticket.title}</h1>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          </header>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Detail label="Description">
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </Detail>
            </div>
            <Detail label="Customer Email">{ticket.customerEmail}</Detail>
            <Detail label="Created At">{formatDate(ticket.createdAt)}</Detail>
            <Detail label="Updated At">{formatDate(ticket.updatedAt)}</Detail>
          </dl>

          <section aria-label="Edit ticket" className="space-y-4 border-t border-slate-200 pt-5">
            <h2 className="font-medium">Update ticket</h2>
            {saveError && (
              <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {saveError}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Priority" htmlFor="priority">
                <Select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} disabled={saving}>
                  {PRIORITIES.map((value) => (
                    <option key={value} value={value}>
                      {PRIORITY_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status" htmlFor="status">
                <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as Status)} disabled={saving}>
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button onClick={handleSave} disabled={saving || (status === ticket.status && priority === ticket.priority)}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Save Changes
            </Button>
          </section>
        </article>
      ) : null}
    </main>
  );
}
