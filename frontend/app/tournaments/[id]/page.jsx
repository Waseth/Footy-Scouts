"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Calendar, MapPin, Trophy, Users, DollarSign,
  Clock, ChevronRight, CheckCircle, XCircle, AlertCircle,
  Shield, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemedAlert from "@/components/ThemedAlert";

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
    // Scroll to team picker at the bottom
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
    } catch (e) {
      setAlert({ title: "Could not send request", body: e.message, variant: "danger" });
    } finally {
      setRequesting(null);
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

  const { tournament, teams = [] } = data;
  const badge = getStatusBadge(tournament.status);
  const open = isRegistrationOpen(tournament.status);
  const isOrganizer = user && tournament.organizer_user_id === user.id;
  const showTeamPicker = open && myTeams.length > 0;

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

          {/* Team progress */}
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

          {/* CTA */}
          {!isOrganizer && open && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleRequestToJoin}
                className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
              >
                Request to join
              </button>
            </div>
          )}

          {isOrganizer && (
            <div className="mt-6">
              <Link
                href={`/dashboard/organizer/${tournament.id}`}
                className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
              >
                Manage this tournament
              </Link>
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
                return (
                  <div
                    key={entry.id || team.id}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1C1928] p-3"
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
                      <p className="text-white/50 text-xs">
                        {team.member_count || 0} player{(team.member_count || 0) !== 1 ? "s" : ""}
                      </p>
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