"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Custom confirmation modal.
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState(null);
 *   setConfirmState({ title: "...", body: "...", onConfirm: () => {...} });
 *   <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
 */
export default function ConfirmModal({ state, onClose }) {
  if (!state) return null;

  const {
    title = "Are you sure?",
    body = "",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = false,
    onConfirm,
  } = state;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
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
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              destructive ? "bg-red-500/15" : "bg-[#D4AF6A]/15"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${destructive ? "text-red-400" : "text-[#D4AF6A]"}`}
            />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            {body && <p className="text-white/60 text-sm mt-1">{body}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-white/20 text-white px-4 py-2.5 text-sm hover:bg-white/5 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
              destructive
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-[#D4AF6A] text-[#1C1928] hover:bg-[#D4AF6A]/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}