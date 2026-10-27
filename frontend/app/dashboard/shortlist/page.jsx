"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark, Loader2, AlertCircle, Trash2, ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemedAlert from "@/components/ThemedAlert";

export default function ShortlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);
  const [alert, setAlert] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getShortlist();
      setItems(res.items || []);
    } catch (e) {
      setError(e.message || "Could not load shortlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (playerUserId) => {
    setRemoving(playerUserId);
    try {
      await api.removeFromShortlist(playerUserId);
      setItems((prev) => prev.filter((p) => p.player_user_id !== playerUserId));
      setAlert({ title: "Removed", variant: "success" });
    } catch (e) {
      setAlert({ title: "Could not remove", body: e.message, variant: "danger" });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-7 h-7 text-[#D4AF6A]" />
            My Shortlist
          </h1>
          <p className="text-white/60 mt-1">
            Players you've saved for follow-up
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
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
            <Bookmark className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No players shortlisted</p>
            <p className="text-white/50 text-sm mb-4">
              Browse players and click "Add to shortlist" to save them here.
            </p>
            <Link
              href="/players"
              className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
            >
              Find players
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const p = item.player || {};
              return (
                <div
                  key={item.id}
                  className="bg-[#242030] rounded-lg p-5 border border-white/10 hover:border-[#D4AF6A]/40 transition"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] font-bold shrink-0">
                      {p.profile_picture_url ? (
                        <Image
                          src={p.profile_picture_url}
                          alt={p.full_name || ""}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        p.full_name?.[0] || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">
                        {p.full_name || "Unknown"}
                      </p>
                      <p className="text-white/50 text-xs">
                        {p.position || "—"}
                        {p.age ? ` · ${p.age}y` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mb-3">
                    {[p.current_team, p.nationality].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/players/${item.player_user_id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#D4AF6A]/15 text-[#D4AF6A] px-3 py-1.5 text-xs font-medium hover:bg-[#D4AF6A]/25 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View profile
                    </Link>
                    <button
                      onClick={() => handleRemove(item.player_user_id)}
                      disabled={removing === item.player_user_id}
                      className="inline-flex items-center justify-center rounded-md bg-red-500/15 text-red-400 px-3 py-1.5 hover:bg-red-500/25 transition disabled:opacity-50"
                    >
                      {removing === item.player_user_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}