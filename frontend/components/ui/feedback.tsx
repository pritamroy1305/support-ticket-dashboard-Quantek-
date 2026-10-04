import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./button";

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorState({ message, detail, onRetry }: { message: string; detail?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" aria-hidden />
      <div>
        <p className="font-medium text-slate-900">{message}</p>
        {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-medium text-slate-900">{message}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
