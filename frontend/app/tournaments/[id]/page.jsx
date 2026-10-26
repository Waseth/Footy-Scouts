"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Calendar, MapPin, Trophy, Users, DollarSign,
  Clock, ChevronRight, CheckCircle, XCircle, AlertCircle,
  Shield, Loader2, Receipt, CreditCard, Settings, Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemedAlert from "@/components/ThemedAlert";

const ACTIVE_ENTRY_STATUSES = [
  "ACCEPTED", "REGISTERED", "JOIN_REQUESTED", "INVITED",
];

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [myTeams, setMyTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (api.isAuthenticated()) {
          try {
            const me = await api.getMe();
            setUser(me);
            try {
              const teams = await api.getMyTeams({ per_page: 50 });
              setMyTeams(teams.items || []);
            } catch {}
          } catch {}
        }

        const res = await api.getTournament(params.id);
        setData(res);
      } catch (err) {
        setError(err.message || "Tournament not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const isRegistrationOpen = (status) =>
    ["REGISTRATION_OPEN", "FILLING_TEAMS"].includes(status);

  const handleRequestToJoin = () => {
    if (!api.isAuthenticated()) {
      router.push(`/login?redirect=${encodeURIComponent(`/tournaments/${params.id}`)}`);
      return;
    }
    if (myTeams.length === 0) {
      setAlert({
        title: "You don't have a team yet",
        body: "Create a team first to request to join tournaments.",
        variant: "warning",
      });
      return;
    }
    if (requesting) return;
    const el = document.getElementById("team-picker");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handlePickTeam = async (team) => {
    const tournament = data.tournament;
    if (team.member_count < tournament.min_players_per_team) {
      setAlert({
        title: "Team understaffed",
        body: `${team.name} has ${team.member_count} player${team.member_count === 1 ? "" : "s"}, but this tournament requires at least ${tournament.min_players_per_team}.`,
        variant: "warning",
      });
      return;
    }
    setRequesting(team.id);
    try {
      await api.requestTeamToTournament(team.id, tournament.id);
      setAlert({
        title: "Request sent",
        body: `${team.name} has requested to join ${tournament.tournament_name}. The organizer will respond.`,
        variant: "success",
      });
      // Refresh so my_team_entry reflects the new JOIN_REQUESTED status
      const res = await api.getTournament(params.id);
      setData(res);
    } catch (e) {
      setAlert({ title: "Could not send request", body: e.message, variant: "danger" });
    } finally {
      setRequesting(null);
    }
  };

  const handlePayNow = async () => {
    const entry = data?.my_team_entry;
    if (!entry || !entry.can_pay) return;
    setPaying(true);
    try {
      const res = await api.initializeTeamEntryPayment(entry.team_id, params.id);
      window.location.href = res.authorization_url;
    } catch (e) {
      setAlert({
        title: "Could not start payment",
        body: e.message || "Please try again.",
        variant: "danger",
      });
      setPaying(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "REGISTRATION_OPEN":
      case "FILLING_TEAMS":
        return { text: "Registration open", color: "text-green-400 bg-green-500/20" };
      case "ALL_TEAMS_REGISTERED":
        return { text: "Teams full", color: "text-[#D4AF6A] bg-[#D4AF6A]/20" };
      case "REGISTRATION_CLOSED":
        return { text: "Registration closed", color: "text-purple-400 bg-purple-500/20" };
      case "IN_PROGRESS":
        return { text: "In progress", color: "text-blue-400 bg-blue-500/20" };
      case "COMPLETED":
        return { text: "Completed", color: "text-white/60 bg-white/10" };
      case "CANCELLED":
        return { text: "Cancelled", color: "text-red-400 bg-red-500/20" };
      case "DRAFT":
        return { text: "Draft", color: "text-white/50 bg-white/10" };
      default:
        return { text: status.replace(/_/g, " "), color: "text-white/60 bg-white/10" };
    }
  };

  const getEntryStatusBadge = (status) => {
    switch (status) {
      case "REGISTERED":
        return { text: "Paid", color: "text-green-400 bg-green-500/20" };
      case "ACCEPTED":
        return { text: "Accepted — awaiting payment", color: "text-yellow-400 bg-yellow-500/20" };
      case "JOIN_REQUESTED":
        return { text: "Request pending", color: "text-blue-400 bg-blue-500/20" };
      case "INVITED":
        return { text: "Invited", color: "text-[#D4AF6A] bg-[#D4AF6A]/20" };
      case "WITHDRAWN":
        return { text: "Withdrawn", color: "text-red-400 bg-red-500/20" };
      case "REJECTED":
        return { text: "Rejected", color: "text-white/50 bg-white/10" };
      default:
        return { text: status, color: "text-white/60 bg-white/10" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="animate-pulse">
            <div className="h-8 bg-[#242030] rounded w-1/4 mb-6" />
            <div className="bg-[#242030] rounded-lg p-6 border border-white/10">
              <div className="h-10 bg-white/10 rounded w-3/4 mb-4" />
              <div className="h-6 bg-white/10 rounded w-1/2 mb-6" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data?.tournament) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Tournament Not Found</h1>
          <p className="text-white/60 mb-6">
            {error || "The tournament you're looking for doesn't exist."}
          </p>
          <Link href="/tournaments" className="text-[#D4AF6A] hover:underline">
            ← Back to tournaments
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { tournament, teams = [], my_team_entry } = data;
  const badge = getStatusBadge(tournament.status);
  const open = isRegistrationOpen(tournament.status);
  const isOrganizer = user && tournament.organizer_user_id === user.id;

  const hasActiveEntry = Boolean(
    my_team_entry && ACTIVE_ENTRY_STATUSES.includes(my_team_entry.status)
  );
  const showRequestButton = !isOrganizer && open && !hasActiveEntry;
  const showTeamPicker = open && myTeams.length > 0 && !hasActiveEntry;

  const entryTotal = my_team_entry
    ? my_team_entry.team_entry_fee + my_team_entry.platform_fee_per_team
    : 0;

  // The button that goes into the CTA row: either Pay (if can_pay), or a
  // disabled "Request to join" (if already in), or "Request to join" (normal).
  const renderCtaRow = () => {
    if (isOrganizer) {
      return (
        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <Link
            href={`/dashboard/organizer/${tournament.id}`}
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
          >
            Manage this tournament
          </Link>
          {tournament.payout_code && (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
              <Receipt className="w-3.5 h-3.5" />
              Payout:{" "}
              <span className="text-[#D4AF6A] font-mono">{tournament.payout_code}</span>
              {" · "}
              <span
                className={
                  tournament.payout_status === "PAID"
                    ? "text-green-400"
                    : tournament.payout_status === "PENDING"
                    ? "text-yellow-400"
                    : tournament.payout_status === "FAILED"
                    ? "text-red-400"
                    : "text-white/60"
                }
              >
                {tournament.payout_status}
              </span>
            </span>
          )}
        </div>
      );
    }

    if (my_team_entry) {
      // Captain of a team already in this tournament — show Pay (if can_pay)
      // or a status indicator. Never show "Request to join".
      if (my_team_entry.status === "REGISTERED") {
        return (
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 text-green-400 px-5 py-2.5 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Your team is registered
            </span>
            <Link
              href={`/teams/${my_team_entry.team_id}/manage`}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 text-white/80 px-4 py-2.5 text-sm hover:bg-white/5 transition"
            >
              <Settings className="w-4 h-4" /> View team
            </Link>
          </div>
        );
      }

      if (my_team_entry.can_pay) {
        return (
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-2.5 font-semibold hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
            >
              {paying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Starting checkout…
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay {my_team_entry.fee_currency} {entryTotal.toLocaleString()}
                </>
              )}
            </button>
            <Link
              href={`/teams/${my_team_entry.team_id}/manage`}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 text-white/80 px-4 py-2.5 text-sm hover:bg-white/5 transition"
            >
              <Settings className="w-4 h-4" /> Manage team
            </Link>
          </div>
        );
      }

      // ACCEPTED but squad wrong size → guide to fix
      return (
        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <span className="inline-flex items-center gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 px-5 py-2.5 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Squad update needed before payment
          </span>
          <Link
            href={`/teams/${my_team_entry.team_id}/manage`}
            className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-4 py-2.5 text-sm hover:bg-[#D4AF6A]/10 transition"
          >
            <Users className="w-4 h-4" /> Adjust squad
          </Link>
        </div>
      );
    }

    // No entry — normal request button, only when registration is open
    if (open) {
      return (
        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <button
            onClick={handleRequestToJoin}
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
          >
            Request to join
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white/60">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/tournaments" className="hover:text-white/60">Tournaments</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white/80">{tournament.tournament_name}</span>
        </div>

        <Link href="/tournaments" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" /> Back to tournaments
        </Link>

        {/* Personal banner — visible only to the captain of an entered team */}
        {my_team_entry && (
          <div
            className={`mb-6 rounded-xl border p-5 ${
              my_team_entry.status === "REGISTERED"
                ? "border-green-500/40 bg-green-500/10"
                : my_team_entry.can_pay
                ? "border-[#D4AF6A] bg-[#D4AF6A]/10"
                : my_team_entry.status === "ACCEPTED"
                ? "border-yellow-500/40 bg-yellow-500/10"
                : "border-white/20 bg-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-[#1C1928] flex items-center justify-center shrink-0">
                  {my_team_entry.team_logo_url ? (
                    <Image
                      src={my_team_entry.team_logo_url}
                      alt={my_team_entry.team_name || "Team"}
                      width={48}
                      height={48}
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-[#D4AF6A]" />
                  )}
                </div>
                <div className="min-w-0">
                  {my_team_entry.status === "REGISTERED" ? (
                    <>
                      <p className="text-green-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Your team is registered
                      </p>
                      <p className="text-white/70 text-sm mt-0.5">
                        {my_team_entry.team_name} is confirmed and paid
                        {my_team_entry.registered_at
                          ? ` · ${new Date(my_team_entry.registered_at).toLocaleDateString()}`
                          : ""}
                      </p>
                    </>
                  ) : my_team_entry.status === "JOIN_REQUESTED" ? (
                    <>
                      <p className="text-blue-400 font-semibold flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Request pending
                      </p>
                      <p className="text-white/70 text-sm mt-0.5">
                        Waiting for the organizer to approve {my_team_entry.team_name}.
                      </p>
                    </>
                  ) : my_team_entry.can_pay ? (
                    <>
                      <p className="text-[#D4AF6A] font-semibold">
                        You're accepted — complete your entry fee
                      </p>
                      <p className="text-white/70 text-sm mt-0.5">
                        {my_team_entry.team_name} · squad of {my_team_entry.squad_size} ready to compete
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-yellow-400 font-semibold">
                        Squad update needed
                      </p>
                      <p className="text-white/70 text-sm mt-0.5">
                        {my_team_entry.team_name} has {my_team_entry.squad_size} player
                        {my_team_entry.squad_size === 1 ? "" : "s"}.
                        {my_team_entry.squad_size < my_team_entry.min_players_per_team
                          ? ` Add ${my_team_entry.min_players_per_team - my_team_entry.squad_size} more to unlock payment.`
                          : ` Remove ${my_team_entry.squad_size - my_team_entry.max_players_per_team} to unlock payment.`}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {my_team_entry.status !== "REGISTERED" && (
                  <div className="text-right">
                    <p className="text-xs text-white/50">Total to pay</p>
                    <p className="text-[#D4AF6A] font-semibold text-lg">
                      {my_team_entry.fee_currency} {entryTotal.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-white/40">
                      incl. {my_team_entry.platform_fee_per_team.toLocaleString()} platform fee
                    </p>
                  </div>
                )}
                {my_team_entry.status === "REGISTERED" ? (
                  <Link
                    href={`/teams/${my_team_entry.team_id}/manage`}
                    className="inline-flex items-center gap-2 rounded-md border border-green-500/40 text-green-400 px-4 py-2 text-sm font-medium hover:bg-green-500/10 transition"
                  >
                    <Settings className="w-4 h-4" /> View team
                  </Link>
                ) : my_team_entry.can_pay ? (
                  <button
                    onClick={handlePayNow}
                    disabled={paying}
                    className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 text-sm font-semibold hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Starting checkout…
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Pay entry fee
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={`/teams/${my_team_entry.team_id}/manage`}
                    className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/10 transition"
                  >
                    <Users className="w-4 h-4" /> Adjust squad
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-[#242030] rounded-xl border border-white/10 p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                  {badge.text}
                </span>
                <span className="text-xs text-white/50">{tournament.tournament_type}</span>
                {isOrganizer && (
                  <span className="text-[10px] font-semibold text-[#D4AF6A] uppercase">
                    You organize this
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                {tournament.tournament_name}
              </h1>
              <p className="text-white/60 text-sm">
                Organized by {tournament.organization_name}
                {tournament.representative_name && ` · ${tournament.representative_name}`}
              </p>
            </div>
          </div>

          {tournament.description && (
            <p className="text-white/70 leading-relaxed mb-6 whitespace-pre-line">
              {tournament.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tournament.location && (
              <DetailCard icon={MapPin} label="Location" value={tournament.location} />
            )}
            {tournament.start_date && (
              <DetailCard
                icon={Calendar}
                label="Start date"
                value={new Date(tournament.start_date).toLocaleDateString()}
              />
            )}
            {tournament.registration_deadline && (
              <DetailCard
                icon={Calendar}
                label="Registration deadline"
                value={new Date(tournament.registration_deadline).toLocaleDateString()}
              />
            )}
            {tournament.team_entry_fee > 0 && (
              <DetailCard
                icon={DollarSign}
                label="Entry fee"
                value={`${tournament.fee_currency} ${tournament.team_entry_fee.toLocaleString()}`}
              />
            )}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-[#1C1928] border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/60 text-xs uppercase tracking-wide">Teams registered</p>
              <p className="text-white font-semibold">
                {tournament.registered_teams_count} / {tournament.required_teams}
              </p>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#D4AF6A] transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (tournament.registered_teams_count / tournament.required_teams) * 100
                  )}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
              <div>
                <p className="text-white/50 text-xs">Min players/team</p>
                <p className="text-white font-medium">{tournament.min_players_per_team}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Max players/team</p>
                <p className="text-white font-medium">{tournament.max_players_per_team}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Required teams</p>
                <p className="text-white font-medium">{tournament.required_teams}</p>
              </div>
            </div>
          </div>

          {/* CTA row — Pay / Request / Manage depending on state */}
          {renderCtaRow()}

          {/* Organizer payout panel */}
          {isOrganizer && tournament.payout_code && (
            <div className="mt-4 rounded-lg border border-[#D4AF6A]/30 bg-[#D4AF6A]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-[#D4AF6A]" />
                <h3 className="text-white text-sm font-semibold">Payout status</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-white/50">Code</p>
                  <p className="text-white font-mono">{tournament.payout_code}</p>
                </div>
                <div>
                  <p className="text-white/50">Status</p>
                  <p
                    className={
                      tournament.payout_status === "PAID"
                        ? "text-green-400 font-medium"
                        : tournament.payout_status === "PENDING"
                        ? "text-yellow-400 font-medium"
                        : "text-red-400 font-medium"
                    }
                  >
                    {tournament.payout_status}
                  </p>
                </div>
                {tournament.paid_out_at && (
                  <div>
                    <p className="text-white/50">Paid on</p>
                    <p className="text-white">
                      {new Date(tournament.paid_out_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-3 text-[11px] text-white/40">
                Admin will transfer the net amount to your bank / M-Pesa. Check
                your notifications for updates.
              </p>
            </div>
          )}
        </div>

        {/* Organizer + contact */}
        <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Organizer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/50 mb-1">Organization</p>
              <p className="text-white">{tournament.organization_name}</p>
            </div>
            <div>
              <p className="text-white/50 mb-1">Representative</p>
              <p className="text-white">{tournament.representative_name}</p>
            </div>
            {tournament.organization_email && (
              <div>
                <p className="text-white/50 mb-1">Email</p>
                <p className="text-white">{tournament.organization_email}</p>
              </div>
            )}
            {tournament.organization_phone && (
              <div>
                <p className="text-white/50 mb-1">Phone</p>
                <p className="text-white">{tournament.organization_phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Registered teams */}
        {teams.length > 0 && (
          <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">
              Teams in this tournament ({teams.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teams.map((entry) => {
                const team = entry.team || entry;
                const entryStatus = entry.status;
                const statusBadge = entryStatus
                  ? getEntryStatusBadge(entryStatus)
                  : null;
                const isMine = my_team_entry && entry.team_id === my_team_entry.team_id;
                return (
                  <div
                    key={entry.id || team.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      isMine
                        ? "border-[#D4AF6A]/50 bg-[#D4AF6A]/5"
                        : "border-white/10 bg-[#1C1928]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#D4AF6A]/20 flex items-center justify-center overflow-hidden shrink-0">
                      {team.logo_url ? (
                        <Image
                          src={team.logo_url}
                          alt={team.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <Shield className="w-5 h-5 text-[#D4AF6A]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {team.name}
                        {isMine && (
                          <span className="ml-2 text-[10px] font-semibold text-[#D4AF6A] uppercase">
                            your team
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white/50 text-xs">
                          {team.member_count || 0} player
                          {(team.member_count || 0) !== 1 ? "s" : ""}
                        </p>
                        {isOrganizer && statusBadge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${statusBadge.color}`}
                          >
                            {statusBadge.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Team picker */}
        {showTeamPicker && (
          <div
            id="team-picker"
            className="bg-[#242030] rounded-xl border border-[#D4AF6A]/40 p-6 mb-6"
          >
            <h2 className="text-white font-semibold mb-3">Request to join with a team</h2>
            <p className="text-white/60 text-sm mb-4">
              Pick which of your teams should enter this tournament. Your squad must
              have at least {tournament.min_players_per_team} players.
            </p>
            <div className="space-y-2">
              {myTeams.map((team) => {
                const meetsMin = team.member_count >= tournament.min_players_per_team;
                return (
                  <button
                    key={team.id}
                    onClick={() => meetsMin && handlePickTeam(team)}
                    disabled={!meetsMin || requesting === team.id}
                    className={`w-full flex items-center gap-3 rounded-lg border p-3 transition text-left ${
                      meetsMin
                        ? "border-white/10 bg-[#1C1928] hover:border-[#D4AF6A]/50"
                        : "border-yellow-500/20 bg-yellow-500/5 cursor-not-allowed"
                    } disabled:opacity-60`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#D4AF6A]/20 flex items-center justify-center overflow-hidden shrink-0">
                      {team.logo_url ? (
                        <Image
                          src={team.logo_url}
                          alt={team.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <Shield className="w-5 h-5 text-[#D4AF6A]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{team.name}</p>
                      <p
                        className={`text-xs ${
                          meetsMin ? "text-white/50" : "text-yellow-400"
                        }`}
                      >
                        {team.member_count} player{team.member_count !== 1 ? "s" : ""}
                        {!meetsMin &&
                          ` · needs ${tournament.min_players_per_team - team.member_count} more`}
                      </p>
                    </div>
                    {requesting === team.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF6A]" />
                    ) : meetsMin ? (
                      <ChevronRight className="w-4 h-4 text-[#D4AF6A]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Footer />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-[#1C1928] border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-[#D4AF6A]" />
        <p className="text-white/50 text-xs uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-white font-medium text-sm">{value}</p>
    </div>
  );
}