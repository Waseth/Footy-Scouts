"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Loader2, Trophy, Settings, AlertCircle, Calendar,
  MapPin, Users, CreditCard,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

export default function MyTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const result = await api.getMyTournaments({ per_page: 50 });
        setTournaments(result.items || []);
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
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Tournaments</h1>
            <p className="text-white/60 mt-1">Tournaments you organize</p>
          </div>
          <Link
            href="/tournaments/create"
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
          >
            <Plus className="w-4 h-4" /> Create tournament
          </Link>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/10 bg-[#242030]">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-1">No tournaments yet</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto mb-4">
              Create your first tournament to start inviting teams.
            </p>
            <Link
              href="/tournaments/create"
              className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
            >
              <Plus className="w-4 h-4" /> Create tournament
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((t) => {
              const isPaid = t.status === "REGISTRATION_CLOSED" || t.status === "IN_PROGRESS" || t.status === "COMPLETED";
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/organizer/${t.id}`}
                  className="block rounded-xl border border-white/10 bg-[#242030] p-5 hover:border-[#D4AF6A]/50 transition group"
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            STATUS_COLORS[t.status] || STATUS_COLORS.DRAFT
                          }`}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-white/40">{t.tournament_type}</span>
                        {isPaid && t.payout_code && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D4AF6A]/20 text-[#D4AF6A] inline-flex items-center gap-1">
                            <CreditCard className="w-2.5 h-2.5" />
                            {t.payout_status || "PENDING"}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold text-lg group-hover:text-[#D4AF6A] transition">
                        {t.tournament_name}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/50">
                        {t.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {t.location}
                          </span>
                        )}
                        {t.start_date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(t.start_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {t.registered_teams_count}/{t.required_teams} teams
                          {t.accepted_teams_count > 0 && (
                            <>
                              {" · "}
                              <span className="text-blue-400">
                                {t.accepted_teams_count} unpaid
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <Settings className="w-5 h-5 text-white/30 group-hover:text-[#D4AF6A] transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}