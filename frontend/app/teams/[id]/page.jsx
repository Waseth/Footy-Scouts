"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Shield, Users, Loader2, Settings, UserPlus,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemedAlert from "@/components/ThemedAlert";

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getTeam(params.id);
        setData(res);
      } catch (e) {
        setError(e.message || "Team not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const handleRequestJoin = async () => {
    setRequesting(true);
    try {
      await api.requestToJoinTeam(params.id);
      setAlert({
        title: "Request sent",
        body: "The captain will review your request. You'll get a notification when they respond.",
        variant: "success",
      });
    } catch (e) {
      setAlert({
        title: "Could not send request",
        body: e.message || "Please try again.",
        variant: "danger",
      });
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Link href="/dashboard/teams" className="text-[#D4AF6A] hover:underline">
            ← Back to my teams
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { team, members, is_captain } = data;

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <Link
          href={is_captain ? "/dashboard/teams" : "/teams/available"}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {is_captain ? "Back to my teams" : "Back to available teams"}
        </Link>

        <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="w-24 h-24 rounded-xl bg-[#D4AF6A]/20 flex items-center justify-center overflow-hidden shrink-0">
              {team.logo_url ? (
                <Image src={team.logo_url} alt={team.name} width={96} height={96} className="object-cover" />
              ) : (
                <Shield className="w-12 h-12 text-[#D4AF6A]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{team.name}</h1>
              {team.description && (
                <p className="text-white/60 text-sm mt-2">{team.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-white/50 mt-3">
                <Users className="w-4 h-4" />
                {team.member_count} player{team.member_count !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {is_captain && (
                <Link
                  href={`/teams/${team.id}/manage`}
                  className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
                >
                  <Settings className="w-4 h-4" /> Manage team
                </Link>
              )}
              {!is_captain && (
                <button
                  onClick={handleRequestJoin}
                  disabled={requesting}
                  className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
                >
                  {requesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Request to join
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#242030] rounded-xl border border-white/10 p-6">
          <h2 className="text-white font-semibold mb-4">Squad</h2>
          {members.length === 0 ? (
            <p className="text-white/40 text-sm">No players yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1C1928] p-3"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] font-bold shrink-0">
                    {m.player_picture_url ? (
                      <Image src={m.player_picture_url} alt={m.player_name || ""} width={40} height={40} className="object-cover" />
                    ) : (
                      m.player_name?.[0] || "?"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">
                      {m.player_name || "Unknown"}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {m.player_position || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}