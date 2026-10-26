"use client";

import { useEffect, useState } from "react";
import {
  Loader2, AlertCircle, CreditCard, ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import ThemedAlert from "@/components/ThemedAlert";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "COMPLETED", label: "Completed" },
  { key: "PENDING", label: "Pending" },
  { key: "FAILED", label: "Failed" },
  { key: "REFUNDED", label: "Refunded" },
];

const PURPOSE_TABS = [
  { key: "", label: "All purposes" },
  { key: "SUBSCRIPTION", label: "Subscriptions" },
  { key: "TEAM_TOURNAMENT_ENTRY", label: "Team entries" },
];

const STATUS_COLORS = {
  COMPLETED: "bg-green-500/20 text-green-400",
  PENDING: "bg-yellow-500/20 text-yellow-400",
  FAILED: "bg-red-500/20 text-red-400",
  REFUNDED: "bg-blue-500/20 text-blue-400",
  ABANDONED: "bg-white/10 text-white/50",
};

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState("");
  const [purpose, setPurpose] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAdminPayments({
        status: status || undefined,
        purpose: purpose || undefined,
      });
      setPayments(data.items || []);
    } catch (e) {
      setError(e.message || "Could not load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, purpose]);

  const handleRefund = (payment) => {
    setConfirmState({
      title: "Refund this payment?",
      body: `Refund KES ${payment.amount.toLocaleString()} to the customer. ` +
        `This marks the payment REFUNDED and (for team entries) frees the team's slot. ` +
        `You must transfer the money manually — this does not call Paystack's refund API.`,
      confirmLabel: "Mark as refunded",
      destructive: true,
      onConfirm: async () => {
        try {
          await api.refundPayment(payment.id, {
            reason: "Refunded by admin from admin panel",
          });
          setAlert({
            title: "Payment refunded",
            body: "Customer has been notified.",
            variant: "success",
          });
          load();
        } catch (e) {
          setAlert({ title: "Refund failed", body: e.message, variant: "danger" });
        }
      },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-white/60 mt-1">
          All transactions across subscriptions and tournament entries
        </p>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              status === tab.key
                ? "bg-[#D4AF6A] text-[#1C1928]"
                : "bg-[#242030] text-white/60 hover:text-white border border-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {PURPOSE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPurpose(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              purpose === tab.key
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
      ) : payments.length === 0 ? (
        <div className="bg-[#242030] rounded-xl border border-white/10 p-12 text-center">
          <CreditCard className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No payments match this filter</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#242030] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1C1928] text-left text-white/50 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-white/80">
                      {p.paystack_reference || "—"}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {p.purpose === "SUBSCRIPTION" && p.plan
                        ? `SUB · ${p.plan}`
                        : p.purpose}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {p.currency} {p.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          STATUS_COLORS[p.status] || "bg-white/10 text-white/60"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "COMPLETED" && (
                        <button
                          onClick={() => handleRefund(p)}
                          className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}