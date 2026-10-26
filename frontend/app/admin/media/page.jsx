"use client";

import { useEffect, useState } from "react";
import {
  Loader2, AlertCircle, Image as ImageIcon, Check, X,
} from "lucide-react";
import { api } from "@/lib/api";
import ThemedAlert from "@/components/ThemedAlert";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminMediaPage() {
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // list_media uses `status` filter on the raw endpoint
      const query = status ? `?status=${status}` : "";
      const res = await api.request(`/admin/media${query}`);
      setItems(res.data.items || []);
    } catch (e) {
      setError(e.message || "Could not load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const approve = async (m) => {
    try {
      await api.request(`/admin/media/${m.id}/approve`, { method: "POST" });
      setAlert({ title: "Approved", variant: "success" });
      load();
    } catch (e) {
      setAlert({ title: "Error", body: e.message, variant: "danger" });
    }
  };

  const reject = async (m) => {
    try {
      await api.request(`/admin/media/${m.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ note: "Rejected by admin" }),
      });
      setAlert({ title: "Rejected", variant: "warning" });
      load();
    } catch (e) {
      setAlert({ title: "Error", body: e.message, variant: "danger" });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Media Moderation</h1>
        <p className="text-white/60 mt-1">
          Approve or reject player uploads
        </p>
      </div>

      <div className="flex gap-2 mb-4">
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
      ) : items.length === 0 ? (
        <div className="bg-[#242030] rounded-xl border border-white/10 p-12 text-center">
          <ImageIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No media in this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-white/10 bg-[#242030] p-4 flex items-center gap-3 flex-wrap"
            >
              <ImageIcon className="w-5 h-5 text-[#D4AF6A] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {m.title || m.media_type || "Media"}
                </p>
                <p className="text-white/50 text-xs">
                  {m.media_type} · {m.is_approved ? "Approved" : "Not approved"}
                  {m.moderation_note && ` · ${m.moderation_note}`}
                </p>
              </div>
              <div className="flex gap-2">
                {!m.is_approved && (
                  <button
                    onClick={() => approve(m)}
                    className="rounded-md bg-green-500/20 text-green-400 px-3 py-1.5 text-xs hover:bg-green-500/30 transition inline-flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Approve
                  </button>
                )}
                {m.is_approved && (
                  <button
                    onClick={() => reject(m)}
                    className="rounded-md bg-red-500/20 text-red-400 px-3 py-1.5 text-xs hover:bg-red-500/30 transition inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}