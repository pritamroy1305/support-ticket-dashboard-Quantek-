"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastKind = "success" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<(kind: ToastKind, message: string) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg"
          >
            {toast.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
