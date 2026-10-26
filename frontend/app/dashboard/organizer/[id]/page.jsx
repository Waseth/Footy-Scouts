"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Loader2, Trophy, Calendar, MapPin, Users,
  Check, X, Send, AlertCircle, Shield, Lock, Copy, HandCoins,
  PlusCircle, RefreshCw, CreditCard, Clock, ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConfirmModal from "@/components/ConfirmModal";
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
  INVITED: "bg-white/10 text-white/60",
  JOIN_REQUESTED: "bg-yellow-500/20 text-yellow-400",
  ACCEPTED: "bg-blue-500/20 text-blue-400",
  REGISTERED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
  WITHDRAWN: "bg-white/10 text-white/40",
};

function TeamRow({ entry, actioning, onApprove, onReject, variant }) {
  const team = entry.team;
  const isRegistered = entry.status === "REGISTERED";
  const payment = entry.payment;
  const canApprove = entry.status === "JOIN_REQUESTED";
  const canReject = ["JOIN_REQUESTED", "INVITED"].includes(entry.status);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-[#1C1928] p-3 flex-wrap ${
        isRegistered ? "border-green-500/20" : "border-white/10"
      }`}
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
          <Link
            href={`/teams/${entry.team_id}`}
            className="text-white text-sm font-medium truncate hover:text-[#D4AF6A] transition inline-flex items-center gap-1"
          >
            {team?.name || "Unknown team"}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Link>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
              ENTRY_STATUS_COLORS[entry.status] || "bg-white/10 text-white/60"
            }`}
          >
            {entry.status.replace(/_/g, " ")}
          </span>
        </div>
        <div className="text-white/50 text-xs mt-0.5 flex flex-wrap gap-x-3">
          <span>
            {team?.member_count || 0} player{(team?.member_count || 0) !== 1 ? "s" : ""}
          </span>
          <span>·</span>
          <span>{entry.invited_by_organizer ? "Invited by you" : "Requested to join"}</span>
          {team?.captain_email && (
            <>
              <span>·</span>
              <span className="truncate">{team.captain_email}</span>
            </>
          )}
        </div>
        {isRegistered && payment && (
          <div className="mt-1.5 text-[11px] text-green-400 flex items-center gap-1.5 flex-wrap">
            <CreditCard className="w-3 h-3" />
            <span>
              Paid {payment.currency} {payment.amount.toLocaleString()}
            </span>
            {payment.channel && (
              <>
                <span>·</span>
                <span className="capitalize">{payment.channel.replace(/_/g, " ")}</span>
              </>
            )}
            {payment.completed_at && (
              <>
                <span>·</span>
                <span>{new Date(payment.completed_at).toLocaleString()}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {canApprove && (
          <button
            onClick={() => onApprove(entry)}
            disabled={actioning === entry.id}
            className="rounded-md bg-green-500/20 text-green-400 px-3 py-1.5 text-xs font-medium hover:bg-green-500/30 transition inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Check className="w-3 h-3" /> Approve
          </button>
        )}
        {canReject && (
          <button
            onClick={() => onReject(entry)}
            disabled={actioning === entry.id}
            className="rounded-md bg-red-500/20 text-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-500/30 transition inline-flex items-center gap-1 disabled:opacity-50"
          >
            <X className="w-3 h-3" /> {variant === "invited" ? "Cancel" : "Reject"}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, subtitle, count, children, accent }) {
  if (count === 0) return null;
  return (
    <div className={`bg-[#242030] rounded-xl border p-6 mb-4 ${
      accent === "action" ? "border-yellow-500/30" :
      accent === "paid" ? "border-green-500/30" :
      accent === "accepted" ? "border-blue-500/30" :
      "border-white/10"
    }`}>
      <div className="mb-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          {title}
          <span className="text-xs font-normal text-white/40">({count})</span>
        </h2>
        {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function ManageTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

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

  const handlePublish = () => {
    setConfirmState({
      title: "Publish tournament?",
      body: "Teams will be able to request to join, and you can invite teams directly.",
      confirmLabel: "Publish",
      onConfirm: async () => {
        setActioning("publish");
        try {
          await api.publishTournament(params.id);
          await load();
          setAlert({
            title: "Tournament published",
            body: "Teams can now request to join.",
            variant: "success",
          });
        } catch (e) {
          setAlert({ title: "Could not publish", body: e.message, variant: "danger" });
        } finally {
          setActioning(null);
        }
      },
    });
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

  const handleCloseRegistration = () => {
    const t = data.tournament;
    const gross = (t.team_entry_fee + t.platform_fee_per_team) * t.required_teams;
    const net = t.team_entry_fee * t.required_teams;
    const platform = t.platform_fee_per_team * t.required_teams;

    setConfirmState({
      title: "Close registration?",
      body:
        `This is final — you cannot reopen registration after closing.\n\n` +
        `Gross collected: KES ${gross.toLocaleString()}\n` +
        `Platform fee: KES ${platform.toLocaleString()}\n` +
        `You will receive: KES ${net.toLocaleString()}\n\n` +
        `A payout code will be generated for admin to send your funds.`,
      confirmLabel: "Close registration",
      destructive: true,
      onConfirm: async () => {
        setActioning("close");
        try {
          const res = await api.closeTournamentRegistration(params.id);
          await load();
          setAlert({
            title: "Registration closed",
            body: `Payout code: ${res.tournament.payout_code}`,
            variant: "success",
          });
        } catch (e) {
          setAlert({ title: "Could not close", body: e.message, variant: "danger" });
        } finally {
          setActioning(null);
        }
      },
    });
  };

  const handleInviteTeam = async (team) => {
    if (team.member_count < data.tournament.min_players_per_team) {
      setAlert({
        title: "Team understaffed",
        body: `${team.name} has ${team.member_count} player${team.member_count === 1 ? "" : "s"} — needs at least ${data.tournament.min_players_per_team}.`,
        variant: "warning",
      });
      return;
    }
    setActioning(team.id);
    try {
      await api.inviteTeamToTournament(params.id, team.id);
      await load();
      await loadAvailableTeams(inviteSearch);
      setAlert({
        title: "Invitation sent",
        body: `${team.name} has been invited.`,
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
  const isClosed = ["REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED"].includes(tournament.status);
  const canClose =
    tournament.registered_teams_count >= tournament.required_teams &&
    !["REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(tournament.status);

  // Group entries by status
  const joinRequested = teams.filter((t) => t.status === "JOIN_REQUESTED");
  const invited = teams.filter((t) => t.status === "INVITED");
  const accepted = teams.filter((t) => t.status === "ACCEPTED");
  const registered = teams.filter((t) => t.status === "REGISTERED");
  const other = teams.filter((t) =>
    !["JOIN_REQUESTED", "INVITED", "ACCEPTED", "REGISTERED"].includes(t.status)
  );

  const needsActionCount = joinRequested.length;
  const slotsLeft = Math.max(0, tournament.required_teams - tournament.registered_teams_count);

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

        {/* Header card */}
        <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                    STATUS_COLORS[tournament.status] || STATUS_COLORS.DRAFT
                  }`}
                >
                  {tournament.status.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-white/50">{tournament.tournament_type}</span>
                {needsActionCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-400">
                    {needsActionCount} needs action
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {tournament.tournament_name}
              </h1>
              <p className="text-white/60 text-sm mt-1">{tournament.organization_name}</p>
            </div>
          </div>

          {/* Live counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="rounded-lg bg-[#1C1928] border border-white/10 p-3">
              <p className="text-white/50 text-[10px] uppercase tracking-wide">Registered</p>
              <p className="text-white font-semibold text-lg">
                {tournament.registered_teams_count} / {tournament.required_teams}
              </p>
            </div>
            <div className="rounded-lg bg-[#1C1928] border border-blue-500/20 p-3">
              <p className="text-blue-400 text-[10px] uppercase tracking-wide">Accepted · unpaid</p>
              <p className="text-white font-semibold text-lg">{accepted.length}</p>
            </div>
            <div className="rounded-lg bg-[#1C1928] border border-yellow-500/20 p-3">
              <p className="text-yellow-400 text-[10px] uppercase tracking-wide">Awaiting approval</p>
              <p className="text-white font-semibold text-lg">{joinRequested.length}</p>
            </div>
            <div className="rounded-lg bg-[#1C1928] border border-white/10 p-3">
              <p className="text-white/50 text-[10px] uppercase tracking-wide">Slots left</p>
              <p className={`font-semibold text-lg ${slotsLeft === 0 ? "text-green-400" : "text-white"}`}>
                {slotsLeft}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-white/50 text-xs uppercase mb-1">Location</p>
              <p className="text-white inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF6A]" />
                {tournament.location || "—"}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase mb-1">Start date</p>
              <p className="text-white inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF6A]" />
                {tournament.start_date
                  ? new Date(tournament.start_date).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase mb-1">Entry fee</p>
              <p className="text-white inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#D4AF6A]" />
                {tournament.fee_currency} {tournament.team_entry_fee.toLocaleString()} /team
              </p>
            </div>
          </div>

          {/* Actions */}
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
                {showInvite ? "Close invite panel" : "Invite a team"}
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
                Close registration
              </button>
            )}
          </div>

          {canClose && accepted.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {accepted.length} accepted team{accepted.length === 1 ? "" : "s"} haven't paid yet.
                Closing now will not include them. Wait for their payment to keep them in.
              </span>
            </div>
          )}

          {/* Payout summary */}
          {isClosed && tournament.payout_code && (
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-green-400 text-sm font-medium mb-2 flex items-center gap-2">
                <HandCoins className="w-4 h-4" /> Payout ready
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <p className="text-white/50 text-xs">Gross collected</p>
                  <p className="text-white font-medium">
                    {tournament.fee_currency}{" "}
                    {tournament.total_required_from_teams.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Platform fee</p>
                  <p className="text-white/70">
                    {tournament.fee_currency}{" "}
                    {(tournament.platform_fee_per_team * tournament.required_teams).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">You receive</p>
                  <p className="text-[#D4AF6A] font-semibold">
                    {tournament.fee_currency} {tournament.tournament_fee_total.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <code className="flex-1 rounded-md bg-[#1C1928] px-3 py-2 text-[#D4AF6A] font-mono text-sm">
                  {tournament.payout_code}
                </code>
                <button
                  onClick={copyPayoutCode}
                  className="rounded-md bg-[#D4AF6A] text-[#1C1928] p-2 hover:bg-[#D4AF6A]/90 transition"
                  title="Copy payout code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-white/50">
                Status:{" "}
                <span
                  className={
                    tournament.payout_status === "PAID"
                      ? "text-green-400"
                      : tournament.payout_status === "PENDING"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }
                >
                  {tournament.payout_status}
                </span>
                {tournament.paid_out_at && (
                  <> · Paid {new Date(tournament.paid_out_at).toLocaleDateString()}</>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Invite panel */}
        {showInvite && isOpen && (
          <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-4">
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
                          <Image
                            src={team.logo_url}
                            alt={team.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <Shield className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {team.name}
                        </p>
                        <p
                          className={`text-xs ${
                            meetsMin ? "text-white/50" : "text-yellow-400"
                          }`}
                        >
                          {team.member_count} player
                          {team.member_count !== 1 ? "s" : ""}
                          {!meetsMin &&
                            ` · needs ${tournament.min_players_per_team - team.member_count} more`}
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

        {/* Needs action — join requests */}
        <Section
          title="Awaiting your approval"
          subtitle="Teams that requested to join. Approve to accept them into the tournament."
          count={joinRequested.length}
          accent="action"
        >
          {joinRequested.map((entry) => (
            <TeamRow
              key={entry.id}
              entry={entry}
              actioning={actioning}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </Section>

        {/* Accepted not paid */}
        <Section
          title="Accepted · awaiting payment"
          subtitle="These teams have a slot reserved but haven't paid. They can still pay from their team page."
          count={accepted.length}
          accent="accepted"
        >
          {accepted.map((entry) => (
            <TeamRow
              key={entry.id}
              entry={entry}
              actioning={actioning}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </Section>

        {/* Registered / paid */}
        <Section
          title="Registered · paid"
          subtitle="Confirmed teams. Their entry fee has been received."
          count={registered.length}
          accent="paid"
        >
          {registered.map((entry) => (
            <TeamRow
              key={entry.id}
              entry={entry}
              actioning={actioning}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </Section>

        {/* Invited / withdrawn */}
        <Section
          title="Invited · pending response"
          subtitle="Teams you invited who haven't accepted yet."
          count={invited.length}
        >
          {invited.map((entry) => (
            <TeamRow
              key={entry.id}
              entry={entry}
              actioning={actioning}
              onApprove={handleApprove}
              onReject={handleReject}
              variant="invited"
            />
          ))}
        </Section>

        {other.length > 0 && (
          <Section
            title="Rejected / withdrawn"
            count={other.length}
          >
            {other.map((entry) => (
              <TeamRow
                key={entry.id}
                entry={entry}
                actioning={actioning}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </Section>
        )}

        {teams.length === 0 && (
          <div className="bg-[#242030] rounded-xl border border-white/10 p-8 text-center">
            <Trophy className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No teams yet</p>
            <p className="text-white/50 text-sm">
              {isOpen
                ? "Invite teams or wait for join requests."
                : isDraft
                ? "Publish the tournament to start accepting teams."
                : "This tournament has no teams."}
            </p>
          </div>
        )}
      </div>
      <Footer />

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}