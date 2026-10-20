"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, X, Users, Bell } from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function InvitationsPage() {
  const router = useRouter();
  const [invites, setInvites] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [inv, reqs] = await Promise.all([
        api.getMyPlayerInvitations({ per_page: 50 }),
        api.getMyJoinRequests({ per_page: 50 }),
      ]);
      setInvites(inv.items || []);
      setJoinRequests(reqs.items || []);
    } catch (e) {
      if (e.message?.toLowerCase().includes("unauthorized")) {
        router.push("/login");
        return;
      }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = async (invite) => {
    setActing(invite.id);
    try {
      await api.acceptPlayerInvite(invite.id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (invite) => {
    setActing(invite.id);
    try {
      await api.rejectPlayerInvite(invite.id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(null);
    }
  };

  const handleCancelRequest = async (req) => {
    setActing(req.id);
    try {
      await api.cancelJoinRequest(req.id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-2">Invitations</h1>
        <p className="text-white/60 mb-8">
          Team invites and your pending requests
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Team invitations received */}
        <div className="mb-8">
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#D4AF6A]" /> Team invitations
          </h2>
          {invites.length === 0 ? (
            <p className="text-white/40 text-sm">No pending invitations.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-lg border border-white/10 bg-[#242030] p-4"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-white font-medium">
                        {inv.team_name || "Team"}
                      </p>
                      {inv.message && (
                        <p className="text-sm text-white/60 mt-1">"{inv.message}"</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(inv)}
                        disabled={acting === inv.id}
                        className="rounded-md bg-green-500/20 text-green-400 px-4 py-2 text-sm font-medium hover:bg-green-500/30 transition inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        {acting === inv.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(inv)}
                        disabled={acting === inv.id}
                        className="rounded-md bg-red-500/20 text-red-400 px-4 py-2 text-sm font-medium hover:bg-red-500/30 transition inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My join requests */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4AF6A]" /> My join requests
          </h2>
          {joinRequests.length === 0 ? (
            <p className="text-white/40 text-sm">No pending requests.</p>
          ) : (
            <div className="space-y-2">
              {joinRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#242030] p-4 flex-wrap"
                >
                  <div>
                    <p className="text-white font-medium">
                      {req.team_name || "Team"}
                    </p>
                    <p className="text-xs text-white/50">
                      Status: {req.status}
                    </p>
                  </div>
                  {req.status === "PENDING" && (
                    <button
                      onClick={() => handleCancelRequest(req)}
                      disabled={acting === req.id}
                      className="rounded-md border border-white/20 text-white/70 px-4 py-2 text-sm hover:bg-white/5 transition disabled:opacity-50"
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}