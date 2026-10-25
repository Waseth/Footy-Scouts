"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Loader2, Trophy, Calendar, MapPin, Users,
  Check, X, Send, AlertCircle, Shield, Lock, Copy, HandCoins,
  PlusCircle, RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemedAlert from "@/components/ThemedAlert";

const STATUS_COLORS = {
  DRAFT: "bg-white/10 text-white/60",
  PUBLISHED: "bg-blue-500/20 text-blue-400",
  REGISTRATION_OPEN: "bg-green-500/20 text-green-400",
  FILLING_TEAMS: "bg-yellow-500/20 text-yellow-400",
  ALL_TEAMS_REGISTERED: "bg-[#D4AF6A]/20 text-[#D4AF6A]",
  REGISTRATION_CLOSED: "bg-purple-500/20 text-purple-400",
  IN_PROGRESS: "bg-blue-500/20 text-blue-400",
  COMPLETED: "bg-white/10 text-white/60",
  CANCELLED: "bg-red-500/20 text-red-400",
};

const ENTRY_STATUS_COLORS = {
  INVITED: "bg-white/10 text-white/50",
  JOIN_REQUESTED: "bg-yellow-500/20 text-yellow-400",
  ACCEPTED: "bg-blue-500/20 text-blue-400",
  REGISTERED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
  WITHDRAWN: "bg-white/10 text-white/40",
};

export default function ManageTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [actioning, setActioning] = useState(null);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const load = async () => {
    try {
      const res = await api.getTournament(params.id);
      setData(res);
    } catch (e) {
      setError(e.message || "Could not load tournament");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Load available teams when invite panel opens
  useEffect(() => {
    if (!showInvite) return;
    loadAvailableTeams(inviteSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInvite]);

  const loadAvailableTeams = async (q) => {
    setLoadingTeams(true);
    try {
      const teams = await api.getAvailableTeamsForTournament(params.id, q);
      setAvailableTeams(teams);
    } catch (e) {
      setAlert({ title: "Could not load teams", body: e.message, variant: "danger" });
    } finally {
      setLoadingTeams(false);
    }
  };

  const handlePublish = async () => {
    setActioning("publish");
    try {
      await api.publishTournament(params.id);
      await load();
      setAlert({
        title: "Tournament published",
        body: "Teams can now request to join. You can also invite teams directly.",
        variant: "success",
      });
    } catch (e) {
      setAlert({ title: "Could not publish", body: e.message, variant: "danger" });
    } finally {
      setActioning(null);
    }
  };

  const handleApprove = async (entry) => {
    setActioning(entry.id);
    try {
      await api.approveTournamentTeam(params.id, entry.id);
      await load();
    } catch (e) {
      setAlert({ title: "Could not approve", body: e.message, variant: "danger" });
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (entry) => {
    setActioning(entry.id);
    try {
      await api.rejectTournamentTeam(params.id, entry.id);
      await load();
    } catch (e) {
      setAlert({ title: "Could not reject", body: e.message, variant: "danger" });
    } finally {
      setActioning(null);
    }
  };

  const handleCloseRegistration = async () => {
    setActioning("close");
    try {
      const res = await api.closeTournamentRegistration(params.id);
      await load();
      setAlert({
        title: "🎉 Registration closed",
        body: `Your payout of KSh ${res.payout.net_to_organizer.toLocaleString()} is ready.\n\nPayout code: ${res.tournament.payout_code}\n\nContact admin with this code to receive payment.`,
        variant: "success",
      });
    } catch (e) {
      setAlert({ title: "Could not close registration", body: e.message, variant: "danger" });
    } finally {
      setActioning(null);
    }
  };

  const handleInviteTeam = async (team) => {
    // Check min capacity
    if (team.member_count < data.tournament.min_players_per_team) {
      setAlert({
        title: "Team understaffed",
        body: `${team.name} has ${team.member_count} player${team.member_count === 1 ? "" : "s"} — this tournament requires at least ${data.tournament.min_players_per_team}. The captain needs to fill the squad before they can be invited.`,
        variant: "warning",
      });
      return;
    }

    setActioning(team.id);
    try {
      await api.inviteTeamToTournament(params.id, team.id);
      await load();
      setAvailableTeams((prev) => prev.filter((t) => t.id !== team.id));
      setAlert({
        title: "Invitation sent",
        body: `${team.name} has been invited. They'll be notified.`,
        variant: "success",
      });
    } catch (e) {
      setAlert({ title: "Could not invite", body: e.message, variant: "danger" });
    } finally {
      setActioning(null);
    }
  };

  const copyPayoutCode = () => {
    if (data?.tournament?.payout_code) {
      navigator.clipboard.writeText(data.tournament.payout_code);
      setAlert({ title: "Copied", body: "Payout code copied.", variant: "success" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  if (error || !data?.tournament) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <p className="text-white/60 mb-4">{error || "Tournament not found"}</p>
          <Link href="/dashboard/organizer" className="text-[#D4AF6A] hover:underline">
            ← Back to my tournaments
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { tournament, teams = [] } = data;
  const isDraft = tournament.status === "DRAFT";
  const isOpen = ["REGISTRATION_OPEN", "FILLING_TEAMS"].includes(tournament.status);
  const canClose =
    tournament.registered_teams_count >= tournament.required_teams &&
    !["REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(tournament.status);
  const isClosed = ["REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED"].includes(tournament.status);

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-5xl">
        <Link
          href="/dashboard/organizer"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to my tournaments
        </Link>

        <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${STATUS_COLORS[tournament.status] || STATUS_COLORS.DRAFT}`}>
                  {tournament.status.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-white/50">{tournament.tournament_type}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {tournament.tournament_name}
              </h1>
              <p className="text-white/60 text-sm mt-1">{tournament.organization_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-6">
            <div>
              <p className="text-white/50 text-xs uppercase mb-1">Location</p>
              <p className="text-white">{tournament.location || "—"}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase mb-1">Start date</p>
              <p className="text-white">
                {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase mb-1">Teams</p>
              <p className="text-white">
                {tournament.registered_teams_count} / {tournament.required_teams} registered
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-[#1C1928] border border-white/10">
            <p className="text-xs text-white/50 uppercase mb-2">Pricing</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-white/60 text-xs">Per team</p>
                <p className="text-white font-semibold">
                  {tournament.fee_currency} {tournament.team_entry_fee.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Platform fee/team</p>
                <p className="text-white/70">
                  {tournament.fee_currency} {tournament.platform_fee_per_team.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs">You receive</p>
                <p className="text-[#D4AF6A] font-semibold">
                  {tournament.fee_currency} {tournament.tournament_fee_total.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Total from teams</p>
                <p className="text-white/70">
                  {tournament.fee_currency} {tournament.total_required_from_teams.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {isDraft && (
              <button
                onClick={handlePublish}
                disabled={actioning === "publish"}
                className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
              >
                {actioning === "publish" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Publish tournament
              </button>
            )}

            {isOpen && (
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-5 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/10 transition"
              >
                <PlusCircle className="w-4 h-4" />
                Invite a team
              </button>
            )}

            {canClose && (
              <button
                onClick={handleCloseRegistration}
                disabled={actioning === "close"}
                className="inline-flex items-center gap-2 rounded-md bg-green-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
              >
                {actioning === "close" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Close registration &amp; generate payout
              </button>
            )}
          </div>

          {isClosed && tournament.payout_code && (
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-green-400 text-sm font-medium mb-1 flex items-center gap-2">
                <HandCoins className="w-4 h-4" /> Registration closed
              </p>
              <p className="text-white/70 text-xs mb-3">
                Contact admin with this payout code to receive your payment.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-[#1C1928] px-3 py-2 text-[#D4AF6A] font-mono text-sm">
                  {tournament.payout_code}
                </code>
                <button
                  onClick={copyPayoutCode}
                  className="rounded-md bg-[#D4AF6A] text-[#1C1928] p-2 hover:bg-[#D4AF6A]/90 transition"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invite panel */}
        {showInvite && isOpen && (
          <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-white font-semibold">Available teams</h2>
              <button
                onClick={() => loadAvailableTeams(inviteSearch)}
                className="inline-flex items-center gap-1 text-xs text-[#D4AF6A] hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadAvailableTeams(inviteSearch)}
                placeholder="Filter by team name..."
                className="flex-1 rounded-md border border-white/15 bg-[#1C1928] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4AF6A]/60"
              />
              <button
                onClick={() => loadAvailableTeams(inviteSearch)}
                disabled={loadingTeams}
                className="rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
              >
                {loadingTeams ? "…" : "Search"}
              </button>
            </div>

            {loadingTeams ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#D4AF6A] animate-spin" />
              </div>
            ) : availableTeams.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-6">
                No available teams found.
              </p>
            ) : (
              <div className="space-y-2">
                {availableTeams.map((team) => {
                  const meetsMin = team.member_count >= tournament.min_players_per_team;
                  return (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1C1928] p-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] shrink-0 overflow-hidden">
                        {team.logo_url ? (
                          <Image src={team.logo_url} alt={team.name} width={40} height={40} className="object-cover" />
                        ) : (
                          <Shield className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{team.name}</p>
                        <p className={`text-xs ${meetsMin ? "text-white/50" : "text-yellow-400"}`}>
                          {team.member_count} player{team.member_count !== 1 ? "s" : ""}
                          {!meetsMin && ` · needs ${tournament.min_players_per_team - team.member_count} more`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleInviteTeam(team)}
                        disabled={actioning === team.id || !meetsMin}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                          meetsMin
                            ? "bg-[#D4AF6A] text-[#1C1928] hover:bg-[#D4AF6A]/90"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                        title={meetsMin ? "Invite to tournament" : "Team needs more players"}
                      >
                        {actioning === team.id ? "Sending…" : meetsMin ? "Invite" : "Understaffed"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Teams */}
        <div className="bg-[#242030] rounded-xl border border-white/10 p-6">
          <h2 className="text-white font-semibold mb-4">
            Teams in this tournament ({teams.length})
          </h2>
          {teams.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">
              {isOpen
                ? "No teams yet. Invite teams or wait for requests."
                : "No teams yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {teams.map((entry) => {
                const team = entry.team;
                const canApprove = entry.status === "JOIN_REQUESTED";
                const canReject = ["JOIN_REQUESTED", "INVITED"].includes(entry.status);

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1C1928] p-3 flex-wrap"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] shrink-0 overflow-hidden">
                      {team?.logo_url ? (
                        <Image src={team.logo_url} alt={team.name} width={40} height={40} className="object-cover" />
                      ) : (
                        <Shield className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-medium truncate">
                          {team?.name || "Unknown"}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ENTRY_STATUS_COLORS[entry.status] || "bg-white/10 text-white/60"}`}>
                          {entry.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-white/50 text-xs">
                        {team?.member_count || 0} players
                        {entry.invited_by_organizer ? " · You invited" : " · Team requested"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canApprove && (
                        <button
                          onClick={() => handleApprove(entry)}
                          disabled={actioning === entry.id}
                          className="rounded-md bg-green-500/20 text-green-400 px-3 py-1.5 text-xs font-medium hover:bg-green-500/30 transition inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                      )}
                      {canReject && (
                        <button
                          onClick={() => handleReject(entry)}
                          disabled={actioning === entry.id}
                          className="rounded-md bg-red-500/20 text-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-500/30 transition inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}