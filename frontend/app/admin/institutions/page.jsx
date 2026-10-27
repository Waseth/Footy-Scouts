"use client";

import { useEffect, useState } from "react";
import {
  Loader2, AlertCircle, Building2, Check, X,
} from "lucide-react";
import { api } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import ThemedAlert from "@/components/ThemedAlert";

const TYPE_LABELS = {
  SCHOOL: "School",
  TEAM: "Team / Club",
  ACADEMY: "Academy",
  FOOTBALL_ORGANIZATION: "Football Organization",
};

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.request("/admin/institutions/pending");
      setInstitutions(res.data.items || []);
    } catch (e) {
      setError(e.message || "Could not load pending institutions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (inst) => {
    try {
      await api.request(`/admin/institutions/${inst.id}/verify`, {
        method: "POST",
      });
      setAlert({
        title: "Institution verified",
        body: `${inst.institution_name} is now public.`,
        variant: "success",
      });
      load();
    } catch (e) {
      setAlert({ title: "Error", body: e.message, variant: "danger" });
    }
  };

  const handleReject = (inst) => {
    setConfirmState({
      title: "Reject institution?",
      body: `${inst.institution_name} will not be made public. The user remains active.`,
      confirmLabel: "Reject",
      destructive: true,
      onConfirm: async () => {
        try {
          await api.request(`/admin/institutions/${inst.id}/reject`, {
            method: "POST",
            body: JSON.stringify({ reason: "Rejected by admin" }),
          });
          setAlert({ title: "Institution rejected", variant: "warning" });
          load();
        } catch (e) {
          setAlert({ title: "Error", body: e.message, variant: "danger" });
        }
      },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pending Institutions</h1>
        <p className="text-white/60 mt-1">
          Verify institution profiles before they become publicly visible
        </p>
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
      ) : institutions.length === 0 ? (
        <div className="bg-[#242030] rounded-xl border border-white/10 p-12 text-center">
          <Building2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No pending institutions</p>
          <p className="text-white/50 text-sm">
            All institution profiles have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {institutions.map((inst) => (
            <div
              key={inst.id}
              className="rounded-xl border border-white/10 bg-[#242030] p-5"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold">
                    {inst.institution_name}
                  </h3>
                  <p className="text-white/50 text-sm mt-0.5">
                    {TYPE_LABELS[inst.institution_type] || inst.institution_type}
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {[inst.city, inst.country].filter(Boolean).join(", ")}
                    {inst.contact_number && ` · ${inst.contact_number}`}
                  </p>
                  {inst.description && (
                    <p className="text-white/60 text-sm mt-2 line-clamp-2">
                      {inst.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(inst)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-green-600 transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Verify
                  </button>
                  <button
                    onClick={() => handleReject(inst)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 text-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-500/10 transition"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}