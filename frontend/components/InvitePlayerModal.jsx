"use client";

import { useState, useEffect } from "react";
import { X, Search, UserPlus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import Image from "next/image";

export default function InvitePlayerModal({ open, onClose, teamId }) {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open || !teamId) return;
    setQuery("");
    setPlayers([]);
    setError("");
    setSuccess("");
    // Load some suggestions
    search("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teamId]);

  const search = async (q) => {
    setLoading(true);
    setError("");
    try {
      const results = await api.searchPlayersForInvite(teamId, q);
      setPlayers(results);
    } catch (e) {
      setError(e.message || "Could not load players");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (player) => {
    setInvitingId(player.user_id);
    setError("");
    setSuccess("");
    try {
      await api.invitePlayer(teamId, player.user_id);
      setSuccess(`Invitation sent to ${player.full_name}`);
      setPlayers((prev) => prev.filter((p) => p.user_id !== player.user_id));
    } catch (e) {
      setError(e.message || "Could not send invite");
    } finally {
      setInvitingId(null);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#242030] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Invite a player</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search(query)}
            placeholder="Search players by name..."
            className="w-full pl-9 pr-4 py-2.5 rounded-md border border-white/15 bg-[#1C1928] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4AF6A]/60"
          />
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-md border border-green-500/20 bg-green-500/10 p-2 text-xs text-green-400">
            {success}
          </div>
        )}

        <div className="max-h-80 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#D4AF6A] animate-spin" />
            </div>
          ) : players.length === 0 ? (
            <p className="text-center text-sm text-white/40 py-8">
              No players found. Try a different search.
            </p>
          ) : (
            players.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1C1928] p-3"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] font-bold shrink-0">
                  {p.profile_picture_url ? (
                    <Image
                      src={p.profile_picture_url}
                      alt={p.full_name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    p.full_name?.[0] || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {p.full_name}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {p.position || "—"} · {p.nationality || "Unknown"}
                  </p>
                </div>
                <button
                  onClick={() => handleInvite(p)}
                  disabled={invitingId === p.user_id}
                  className="shrink-0 rounded-md bg-[#D4AF6A] text-[#1C1928] px-3 py-1.5 text-xs font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {invitingId === p.user_id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <UserPlus className="w-3 h-3" />
                  )}
                  Invite
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}