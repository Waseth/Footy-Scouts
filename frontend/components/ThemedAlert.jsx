"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, XCircle, Info, X } from "lucide-react";

/**
 * Themed alert / confirm modal.
 *
 * Usage:
 *   const [alert, setAlert] = useState(null);
 *
 *   // Info
 *   setAlert({ title: "Saved", body: "Your changes were saved.", variant: "success" });
 *
 *   // Confirm
 *   setAlert({
 *     title: "Delete this?",
 *     body: "This can't be undone.",
 *     variant: "danger",
 *     confirmLabel: "Delete",
 *     onConfirm: () => doDelete(),
 *   });
 *
 *   <ThemedAlert state={alert} onClose={() => setAlert(null)} />
 */
export default function ThemedAlert({ state, onClose }) {
  // Escape key to dismiss
  useEffect(() => {
    if (!state) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [state, onClose]);

  if (!state) return null;

  const {
    title = "",
    body = "",
    variant = "info", // "info" | "success" | "danger" | "warning"
    confirmLabel,
    cancelLabel = "Close",
    onConfirm,
  } = state;

  const styles = {
    info: { icon: Info, iconColor: "text-[#D4AF6A]", ringColor: "bg-[#D4AF6A]/15" },
    success: { icon: CheckCircle2, iconColor: "text-green-400", ringColor: "bg-green-500/15" },
    danger: { icon: XCircle, iconColor: "text-red-400", ringColor: "bg-red-500/15" },
    warning: { icon: AlertCircle, iconColor: "text-yellow-400", ringColor: "bg-yellow-500/15" },
  }[variant] || {};

  const Icon = styles.icon || Info;
  const isConfirm = !!onConfirm;

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#242030] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.ringColor}`}>
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {title && (
          <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        )}
        {body && (
          <p className="text-white/70 text-sm leading-relaxed">{body}</p>
        )}

        <div className="flex gap-3 mt-6">
          {isConfirm && (
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-white/20 text-white px-4 py-2.5 text-sm hover:bg-white/5 transition"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={isConfirm ? handleConfirm : onClose}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
              variant === "danger"
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-[#D4AF6A] text-[#1C1928] hover:bg-[#D4AF6A]/90"
            }`}
          >
            {isConfirm ? (confirmLabel || "Confirm") : cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}