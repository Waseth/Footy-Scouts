"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2, Trophy, Users, Calendar, MapPin, Lock, Shield,
  Plus, ArrowRight, Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemedAlert from "@/components/ThemedAlert";

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [pendingTournament, setPendingTournament] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        if (api.isAuthenticated()) {
          try {
            const me = await api.getMe();
            setUser(me);
          } catch {}
        }
        const [tourRes, teamsRes] = await Promise.allSettled([
          api.getTournaments({ per_page: 30 }),
          api.isAuthenticated() ? api.getMyTeams({ per_page: 50 }) : Promise.resolve(null),
        ]);
        if (tourRes.status === "fulfilled") setTournaments(tourRes.value.items || []);
        if (teamsRes.status === "fulfilled" && teamsRes.value) {
          setMyTeams(teamsRes.value.items || []);
        }
        if (api.isAuthenticated()) {
          try {
            const myTour = await api.getMyTournaments({ per_page: 50 });
            setMyTournaments(myTour.items || []);
          } catch {}
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRequestToJoin = async (tournament) => {
    if (!api.isAuthenticated()) {
      router.push(`/login?redirect=${encodeURIComponent("/tournaments")}`);
      return;
    }
    setPendingTournament(tournament);
  };

  const handlePickTeam = async (team) => {
    const tournament = pendingTournament;
    if (!tournament) return;
    if (team.member_count < tournament.min_players_per_team) {
      setAlert({
        title: "Team understaffed",
        body: `${team.name} has ${team.member_count} player${team.member_count === 1 ? "" : "s"}, but ${tournament.tournament_name} requires at least ${tournament.min_players_per_team}. Add more players before requesting.`,
        variant: "warning",
      });
      return;
    }
    setRequesting(team.id);
    try {
      await api.requestTeamToTournament(team.id, tournament.id);
      setPendingTournament(null);
      setAlert({
        title: "Request sent",
        body: `${team.name} has requested to join ${tournament.tournament_name}. The organizer will respond.`,
        variant: "success",
      });
    } catch (e) {
      setAlert({ title: "Could not send request", body: e.message || "Try again.", variant: "danger" });
    } finally {
      setRequesting(null);
    }
  };

  const isRegistrationOpen = (status) =>
    ["REGISTRATION_OPEN", "FILLING_TEAMS"].includes(status);

  const isMine = (t) => user && t.organizer_user_id === user.id;

  const displayed = tab === "mine" ? myTournaments : tournaments;

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
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Tournaments</h1>
            <p className="text-white/60 mt-1">
              Browse tournaments, view details, or request to join with your team
            </p>
          </div>
          {user && (
            <Link
              href="/tournaments/create"
              className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
            >
              <Plus className="w-4 h-4" /> Create tournament
            </Link>
          )}
        </div>

        {user && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === "all"
                  ? "bg-[#D4AF6A] text-[#1C1928]"
                  : "border border-white/10 text-white/60 hover:border-[#D4AF6A]/40 hover:text-white"
              }`}
            >
              All tournaments
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === "mine"
                  ? "bg-[#D4AF6A] text-[#1C1928]"
                  : "border border-white/10 text-white/60 hover:border-[#D4AF6A]/40 hover:text-white"
              }`}
            >
              My tournaments ({myTournaments.length})
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {displayed.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/10 bg-[#242030]">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-1">
              {tab === "mine" ? "You don't organize any tournaments" : "No tournaments yet"}
            </h3>
            <p className="text-white/50 text-sm mb-4">
              {tab === "mine"
                ? "Create a tournament to get started."
                : "Check back later — new tournaments will appear here."}
            </p>
            {user && tab === "mine" && (
              <Link
                href="/tournaments/create"
                className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
              >
                <Plus className="w-4 h-4" /> Create tournament
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((t) => {
              const mine = isMine(t);
              const open = isRegistrationOpen(t.status);
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border p-5 transition ${
                    mine ? "border-[#D4AF6A]/50 bg-[#242030]" : "border-white/10 bg-[#242030]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      open
                        ? "bg-green-500/20 text-green-400"
                        : t.status === "REGISTRATION_CLOSED" || t.status === "IN_PROGRESS"
                        ? "bg-purple-500/20 text-purple-400"
                        : t.status === "CANCELLED"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/10 text-white/50"
                    }`}>
                      {t.status.replace(/_/g, " ")}
                    </span>
                    {mine && (
                      <span className="text-[10px] font-semibold text-[#D4AF6A] uppercase">
                        You organize
                      </span>
                    )}
                  </div>

                  <Link href={`/tournaments/${t.id}`}>
                    <h3 className="text-white font-semibold text-lg mb-1 hover:text-[#D4AF6A] transition">
                      {t.tournament_name}
                    </h3>
                  </Link>
                  <p className="text-white/50 text-xs mb-3">{t.tournament_type}</p>

                  <div className="space-y-1.5 mb-4 text-sm">
                    {t.location && (
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="w-4 h-4 text-[#D4AF6A] shrink-0" />
                        <span className="truncate">{t.location}</span>
                      </div>
                    )}
                    {t.start_date && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Calendar className="w-4 h-4 text-[#D4AF6A] shrink-0" />
                        <span>{new Date(t.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/60">
                      <Users className="w-4 h-4 text-[#D4AF6A] shrink-0" />
                      <span>{t.registered_teams_count}/{t.required_teams} teams</span>
                    </div>
                  </div>

                  {/* Actions — View details + Request to join (side by side) */}
                  <div className="flex gap-2">
                    <Link
                      href={`/tournaments/${t.id}`}
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-white/20 text-white/80 px-3 py-2 text-xs font-medium hover:bg-white/5 transition flex-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View details
                    </Link>
                    {open && (
                      <button
                        onClick={() => handleRequestToJoin(t)}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-[#D4AF6A] text-[#1C1928] px-3 py-2 text-xs font-medium hover:bg-[#D4AF6A]/90 transition flex-1"
                      >
                        Request to join
                      </button>
                    )}
                  </div>

                  {mine && (
                    <Link
                      href={`/dashboard/organizer/${t.id}`}
                      className="mt-2 block rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-4 py-2 text-xs text-center font-medium hover:bg-[#D4AF6A]/10 transition"
                    >
                      Manage tournament
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />

      {pendingTournament && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setPendingTournament(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#242030] p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold text-lg mb-1">Request to join</h3>
            <p className="text-white/60 text-sm mb-1">{pendingTournament.tournament_name}</p>
            <p className="text-white/40 text-xs mb-4">
              Min {pendingTournament.min_players_per_team} players · Max{" "}
              {pendingTournament.max_players_per_team} ·{" "}
              {pendingTournament.registered_teams_count}/{pendingTournament.required_teams} teams so far
            </p>

            {myTeams.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-[#1C1928] p-4 text-sm text-white/60 text-center">
                You don't captain any teams. Create a team first.
                <div className="mt-3">
                  <Link
                    href="/teams/create"
                    className="inline-flex items-center gap-1 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-xs font-medium hover:bg-[#D4AF6A]/90"
                  >
                    <Plus className="w-3 h-3" /> Create team
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {myTeams.map((team) => {
                  const meetsMin = team.member_count >= pendingTournament.min_players_per_team;
                  return (
                    <button
                      key={team.id}
                      onClick={() => meetsMin && handlePickTeam(team)}
                      disabled={!meetsMin || requesting === team.id}
                      className={`w-full flex items-center gap-3 rounded-lg border p-3 transition text-left ${
                        meetsMin
                          ? "border-white/10 bg-[#1C1928] hover:border-[#D4AF6A]/50 cursor-pointer"
                          : "border-yellow-500/20 bg-yellow-500/5 cursor-not-allowed"
                      } disabled:opacity-60`}
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
                          {!meetsMin && ` · needs ${pendingTournament.min_players_per_team - team.member_count} more`}
                        </p>
                      </div>
                      {requesting === team.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF6A]" />
                      ) : meetsMin ? (
                        <ArrowRight className="w-4 h-4 text-[#D4AF6A]" />
                      ) : (
                        <Lock className="w-4 h-4 text-yellow-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setPendingTournament(null)}
              className="mt-4 w-full rounded-md border border-white/20 text-white px-4 py-2 text-sm hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}