"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Users, Loader2, Shield, Bell, Check, X, Search,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeamCard from "@/components/TeamCard";
import ThemedAlert from "@/components/ThemedAlert";

const TABS = [
  { key: "my", label: "My Teams", icon: Shield },
  { key: "available", label: "Find Teams", icon: Search },
  { key: "invitations", label: "Invitations", icon: Bell },
];

export default function TeamsHubPage() {
  const router = useRouter();
  const [tab, setTab] = useState("my");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myTeams, setMyTeams] = useState([]);
  const [available, setAvailable] = useState([]);
  const [invites, setInvites] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [acting, setActing] = useState(null);
  const [requestingTeam, setRequestingTeam] = useState(null);

  const load = async () => {
    try {
      const me = await api.getMe();
      setUser(me);

      const [teamsRes, availableRes, invRes, jrRes] = await Promise.allSettled([
        api.getMyTeams({ per_page: 50 }),
        api.getAvailableTeams({ per_page: 30 }),
        api.getMyPlayerInvitations({ per_page: 50 }),
        api.getMyJoinRequests({ per_page: 50 }),
      ]);

      if (teamsRes.status === "fulfilled") setMyTeams(teamsRes.value.items || []);
      if (availableRes.status === "fulfilled") setAvailable(availableRes.value.items || []);
      if (invRes.status === "fulfilled") setInvites(invRes.value.items || []);
      if (jrRes.status === "fulfilled") setJoinRequests(jrRes.value.items || []);
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

  const handleAcceptInvite = async (inv) => {
    setActing(inv.id);
    try {
      await api.acceptPlayerInvite(inv.id);
      await load();
      setAlert({
        title: "You joined the team",
        body: `You're now part of ${inv.team_name}.`,
        variant: "success",
      });
    } catch (e) {
      setAlert({
        title: "Could not join",
        body: e.message || "Try again.",
        variant: "danger",
      });
    } finally {
      setActing(null);
    }
  };

  const handleRejectInvite = async (inv) => {
    setActing(inv.id);
    try {
      await api.rejectPlayerInvite(inv.id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(null);
    }
  };

  const handleCancelJoinRequest = (req) => {
    setAlert({
      title: "Cancel request?",
      body: `You'll withdraw your request to join ${req.team_name}.`,
      variant: "warning",
      confirmLabel: "Yes, cancel",
      onConfirm: async () => {
        try {
          await api.cancelJoinRequest(req.id);
          await load();
        } catch (e) {
          setError(e.message);
        }
      },
    });
  };

  const handleRequestJoin = async (team) => {
    setRequestingTeam(team.id);
    try {
      await api.requestToJoinTeam(team.id);
      await load();
      setAlert({
        title: "Request sent",
        body: `The captain of ${team.name} will review your request.`,
        variant: "success",
      });
    } catch (e) {
      setAlert({
        title: "Could not send request",
        body: e.message || "Try again.",
        variant: "danger",
      });
    } finally {
      setRequestingTeam(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  const canCreateTeam = !!user?.player_profile || user?.role === "PLAYER";
  const pendingInvitesCount = invites.length;

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Teams</h1>
            <p className="text-white/60 mt-1">
              Manage your teams, find new ones, and respond to invites.
            </p>
          </div>
          {canCreateTeam && (
            <Link
              href="/teams/create"
              className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
            >
              <Plus className="w-4 h-4" /> Create team
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            const count =
              t.key === "invitations" ? pendingInvitesCount : 0;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-[#D4AF6A] text-[#1C1928]"
                    : "border border-white/10 text-white/60 hover:border-[#D4AF6A]/40 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {count > 0 && (
                  <span
                    className={`ml-1 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                      active
                        ? "bg-[#1C1928] text-[#D4AF6A]"
                        : "bg-[#D4AF6A] text-[#1C1928]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* My Teams */}
        {tab === "my" && (
          <>
            {myTeams.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No teams yet"
                body="You don't captain or play on any teams yet."
                actionHref={canCreateTeam ? "/teams/create" : "/onboarding/player"}
                actionLabel={canCreateTeam ? "Create your first team" : "Complete player onboarding"}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTeams.map((t) => (
                  <TeamCard key={t.id} team={t} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Available Teams */}
        {tab === "available" && (
          <>
            {available.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No available teams"
                body="No teams are currently accepting new players."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {available.map((t) => {
                  const tournamentInfo = t.active_tournament;
                  const isFull =
                    tournamentInfo &&
                    t.member_count >= tournamentInfo.max_players_per_team;
                  const alreadyRequested = joinRequests.some(
                    (r) => r.team_id === t.id && r.status === "PENDING"
                  );

                  return (
                    <div
                      key={t.id}
                      className="rounded-lg border border-white/10 bg-[#242030] p-5 hover:border-[#D4AF6A]/50 transition"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 rounded-lg bg-[#D4AF6A]/20 flex items-center justify-center overflow-hidden shrink-0">
                          {t.logo_url ? (
                            <Image src={t.logo_url} alt={t.name} width={56} height={56} className="object-cover" />
                          ) : (
                            <Shield className="w-7 h-7 text-[#D4AF6A]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-white truncate">{t.name}</h3>
                          {t.description && (
                            <p className="text-sm text-white/60 truncate">{t.description}</p>
                          )}
                        </div>
                      </div>

                      {tournamentInfo ? (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-white/60">Squad</span>
                            <span
                              className={
                                isFull ? "text-red-400 font-medium" : "text-[#D4AF6A] font-medium"
                              }
                            >
                              {t.member_count} / {tournamentInfo.max_players_per_team}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isFull ? "bg-red-500" : "bg-[#D4AF6A]"
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (t.member_count / tournamentInfo.max_players_per_team) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3 flex items-center gap-2 text-sm text-white/50">
                          <Users className="w-4 h-4" />
                          {t.member_count} player{t.member_count !== 1 ? "s" : ""}
                        </div>
                      )}

                      {isFull ? (
                        <div className="rounded-md border border-white/10 bg-[#1C1928] px-4 py-2 text-center text-sm text-white/40">
                          Squad is full
                        </div>
                      ) : alreadyRequested ? (
                        <div className="rounded-md border border-[#D4AF6A]/30 bg-[#D4AF6A]/10 px-4 py-2 text-center text-sm text-[#D4AF6A]">
                          Request pending
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestJoin(t)}
                          disabled={requestingTeam === t.id}
                          className="w-full rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
                        >
                          {requestingTeam === t.id ? "Sending…" : "Request to join"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* My pending join requests */}
            {joinRequests.filter((r) => r.status === "PENDING").length > 0 && (
              <div className="mt-8">
                <h2 className="text-white font-semibold mb-3">My pending requests</h2>
                <div className="space-y-2">
                  {joinRequests
                    .filter((r) => r.status === "PENDING")
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#242030] p-4 flex-wrap"
                      >
                        <div>
                          <p className="text-white font-medium">{r.team_name}</p>
                          <p className="text-xs text-white/50">Awaiting captain response</p>
                        </div>
                        <button
                          onClick={() => handleCancelJoinRequest(r)}
                          className="rounded-md border border-white/20 text-white/70 px-4 py-2 text-sm hover:bg-white/5 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Invitations */}
        {tab === "invitations" && (
          <>
            {invites.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No pending invitations"
                body="When a captain invites you to their team, it will show up here."
              />
            ) : (
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-lg border border-white/10 bg-[#242030] p-4"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-white font-medium">{inv.team_name}</p>
                        {inv.message && (
                          <p className="text-sm text-white/60 mt-1">"{inv.message}"</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptInvite(inv)}
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
                          onClick={() => handleRejectInvite(inv)}
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
          </>
        )}
      </div>
      <Footer />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, actionHref, actionLabel }) {
  return (
    <div className="text-center py-20 rounded-2xl border border-white/10 bg-[#242030]">
      <Icon className="w-12 h-12 text-white/20 mx-auto mb-4" />
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-white/50 text-sm max-w-md mx-auto mb-4">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}