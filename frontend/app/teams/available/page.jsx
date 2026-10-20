"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2, Users, Shield, AlertCircle, Lock, CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AvailableTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        if (!me.player_profile) {
          router.push("/onboarding/player");
          return;
        }
        const result = await api.getAvailableTeams({ per_page: 30 });
        setTeams(result.items || []);
      } catch (e) {
        if (e.message?.toLowerCase().includes("unauthorized")) {
          router.push("/login");
          return;
        }
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleRequest = async (team) => {
    setRequesting(team.id);
    setError("");
    try {
      await api.requestToJoinTeam(team.id);
      setSuccessMessage(`Request sent to ${team.name}`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (e) {
      setError(e.message || "Could not send request");
    } finally {
      setRequesting(null);
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
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-2">Available teams</h1>
        <p className="text-white/60 mb-8">
          Browse teams and request to join. Teams in tournaments show squad limits.
        </p>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            {successMessage}
          </div>
        )}

        {teams.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No teams available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => {
              const tournamentInfo = t.active_tournament;
              const isFull = tournamentInfo && t.member_count >= tournamentInfo.max_players_per_team;

              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-white/10 bg-[#242030] p-5 hover:border-[#D4AF6A]/50 transition"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 rounded-lg bg-[#D4AF6A]/20 flex items-center justify-center overflow-hidden shrink-0">
                      {t.logo_url ? (
                        <Image
                          src={t.logo_url}
                          alt={t.name}
                          width={56}
                          height={56}
                          className="object-cover"
                        />
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

                  {/* Member count / slot info */}
                  {tournamentInfo ? (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-white/60">Squad</span>
                        <span
                          className={
                            isFull
                              ? "text-red-400 font-medium"
                              : "text-[#D4AF6A] font-medium"
                          }
                        >
                          {t.member_count} / {tournamentInfo.max_players_per_team}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
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
                      <p className="text-xs text-white/40 mt-2">
                        Preparing for {tournamentInfo.tournament_name}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center gap-2 text-sm text-white/50">
                      <Users className="w-4 h-4" />
                      {t.member_count} player{t.member_count !== 1 ? "s" : ""}
                    </div>
                  )}

                  {/* Action button */}
                  {isFull ? (
                    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#1C1928] px-4 py-2 text-sm text-white/40">
                      <Lock className="w-4 h-4" />
                      Squad is full
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRequest(t)}
                      disabled={requesting === t.id}
                      className="w-full rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
                    >
                      {requesting === t.id ? "Sending request…" : "Request to join"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}