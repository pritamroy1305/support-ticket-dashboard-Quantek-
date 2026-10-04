import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";
import { PriorityBadge, StatusBadge } from "./ui/badge";

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <>
      {/* Desktop / tablet: table */}
      <div className="hidden md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="w-[30%] px-4 py-3 font-medium">Title</th>
              <th className="w-[24%] px-4 py-3 font-medium">Customer Email</th>
              <th className="w-[10%] px-4 py-3 font-medium">Priority</th>
              <th className="w-[12%] px-4 py-3 font-medium">Status</th>
              <th className="w-[16%] px-4 py-3 font-medium">Created At</th>
              <th className="w-[8%] px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50">
                <td className="truncate px-4 py-3 font-medium text-slate-900" title={ticket.title}>
                  {ticket.title}
                </td>
                <td className="truncate px-4 py-3 text-slate-600" title={ticket.customerEmail}>
                  {ticket.customerEmail}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(ticket.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/tickets/${ticket.id}`} className="font-medium text-indigo-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="space-y-2 p-4">
            <p className="font-medium text-slate-900">{ticket.title}</p>
            <p className="break-all text-sm text-slate-600">{ticket.customerEmail}</p>
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{formatDate(ticket.createdAt)}</span>
              <Link href={`/tickets/${ticket.id}`} className="font-medium text-indigo-600 hover:underline">
                View
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
