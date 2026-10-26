"use client";

import { useEffect, useState } from "react";
import {
  Loader2, AlertCircle, Receipt, Copy, CheckCircle, XCircle,
  Filter, CreditCard,
} from "lucide-react";
import { api } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import ThemedAlert from "@/components/ThemedAlert";

const STATUS_TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "PAID", label: "Paid" },
  { key: "FAILED", label: "Failed" },
  { key: "", label: "All" },
];

const STATUS_COLORS = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  PAID: "bg-green-500/20 text-green-400",
  FAILED: "bg-red-500/20 text-red-400",
  REFUNDED: "bg-blue-500/20 text-blue-400",
};

function MarkPaidModal({ payout, onClose, onSuccess }) {
  const [method, setMethod] = useState("MPESA");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reference.trim()) {
      setError("Transaction reference is required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.markPayoutPaid(payout.id, {
        payment_method: method,
        transaction_reference: reference.trim(),
        notes: notes.trim(),
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.message || "Could not mark paid");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#242030] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold text-lg mb-1">
          Mark payout as paid
        </h3>
        <p className="text-white/60 text-sm mb-4">
          {payout.tournament_name} · {payout.organizer_email}
        </p>

        <div className="rounded-lg bg-[#1C1928] border border-white/10 p-3 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Net to organizer</span>
            <span className="text-[#D4AF6A] font-semibold">
              KES {parseFloat(payout.net_to_organizer).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/50">Payout code</span>
            <span className="text-white font-mono text-xs">{payout.payout_code}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1.5">
              Payment method
            </label>
            <div className="flex gap-2">
              {["MPESA", "BANK"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                    method === m
                      ? "border-[#D4AF6A] bg-[#D4AF6A]/10 text-[#D4AF6A]"
                      : "border-white/15 text-white/60 hover:border-white/30"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1.5">
              Transaction reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={method === "MPESA" ? "e.g. QKJ4XY7Z1P" : "e.g. bank ref"}
              className="w-full rounded-md border border-white/15 bg-[#1C1928] px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4AF6A]/60"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-white/15 bg-[#1C1928] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4AF6A]/60 resize-none"
              placeholder="Any notes about this payout"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-white/20 text-white px-4 py-2.5 text-sm hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Mark paid"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPayoutsPage() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [markPaid, setMarkPaid] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getPayouts(statusFilter || undefined);
      setPayouts(data.items || []);
    } catch (e) {
      setError(e.message || "Could not load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleMarkFailed = (payout) => {
    setConfirmState({
      title: "Mark payout as FAILED?",
      body: `The organizer will be notified that the attempt to send KES ${parseFloat(
        payout.net_to_organizer
      ).toLocaleString()} failed. You can retry afterwards.`,
      confirmLabel: "Mark failed",
      destructive: true,
      onConfirm: async () => {
        try {
          await api.markPayoutFailed(payout.id, {
            notes: "Marked failed by admin",
          });
          setAlert({ title: "Marked failed", variant: "warning" });
          load();
        } catch (e) {
          setAlert({ title: "Error", body: e.message, variant: "danger" });
        }
      },
    });
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setAlert({ title: "Copied", body: code, variant: "success" });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Organizer Payouts</h1>
        <p className="text-white/60 mt-1">
          Settle payouts to organizers after they close tournament registration
        </p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              statusFilter === tab.key
                ? "bg-[#D4AF6A] text-[#1C1928]"
                : "bg-[#242030] text-white/60 hover:text-white border border-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#D4AF6A] animate-spin" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="bg-[#242030] rounded-xl border border-white/10 p-12 text-center">
          <Receipt className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No {statusFilter.toLowerCase() || ""} payouts</p>
          <p className="text-white/50 text-sm">
            Payouts appear here when organizers close registration.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="rounded-xl border border-white/10 bg-[#242030] p-5"
            >
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        STATUS_COLORS[payout.status] || "bg-white/10 text-white/60"
                      }`}
                    >
                      {payout.status}
                    </span>
                    <span className="text-white/40 text-xs">
                      {new Date(payout.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold">
                    {payout.tournament_name || "Tournament"}
                  </h3>
                  <p className="text-white/50 text-sm">
                    Organizer: {payout.organizer_email || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs">Net to organizer</p>
                  <p className="text-[#D4AF6A] font-semibold text-lg">
                    KES {parseFloat(payout.net_to_organizer).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                <div>
                  <p className="text-white/50">Gross</p>
                  <p className="text-white">
                    KES {parseFloat(payout.gross_collected).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/50">Platform fee</p>
                  <p className="text-white">
                    KES {parseFloat(payout.platform_fee).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/50">Payout code</p>
                  <button
                    onClick={() => copyCode(payout.payout_code)}
                    className="text-white font-mono text-xs inline-flex items-center gap-1 hover:text-[#D4AF6A] transition"
                  >
                    {payout.payout_code}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                {payout.paid_at && (
                  <div>
                    <p className="text-white/50">Paid at</p>
                    <p className="text-white">
                      {new Date(payout.paid_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {payout.status === "PENDING" || payout.status === "FAILED" ? (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setMarkPaid(payout)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-500 text-white px-4 py-2 text-sm font-medium hover:bg-green-600 transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as paid
                  </button>
                  <button
                    onClick={() => handleMarkFailed(payout)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 text-red-400 px-4 py-2 text-sm font-medium hover:bg-red-500/10 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Mark failed
                  </button>
                </div>
              ) : payout.status === "PAID" ? (
                <div className="text-xs text-white/50 flex flex-wrap gap-3">
                  {payout.payment_method && (
                    <span>
                      Method: <span className="text-white/80">{payout.payment_method}</span>
                    </span>
                  )}
                  {payout.transaction_reference && (
                    <span>
                      Ref:{" "}
                      <span className="text-white/80 font-mono">
                        {payout.transaction_reference}
                      </span>
                    </span>
                  )}
                  {payout.notes && <span>· {payout.notes}</span>}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {markPaid && (
        <MarkPaidModal
          payout={markPaid}
          onClose={() => setMarkPaid(null)}
          onSuccess={() => {
            setAlert({
              title: "Payout marked paid",
              body: "The organizer has been notified.",
              variant: "success",
            });
            load();
          }}
        />
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}