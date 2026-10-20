"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Shield, Users, Loader2, UserPlus, Trash2, Check, X, Upload,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InvitePlayerModal from "@/components/InvitePlayerModal";
import ConfirmModal from "@/components/ConfirmModal";
import ImageCropModal from "@/components/ImageCropModal";

export default function ManageTeamPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [error, setError] = useState("");
  const logoInputRef = useRef(null);

  const load = async () => {
    try {
      const res = await api.getTeam(params.id);
      if (!res.is_captain) {
        router.push(`/teams/${params.id}`);
        return;
      }
      setData(res);
    } catch (e) {
      setError(e.message || "Could not load team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleRemoveMember = (member) => {
    setConfirmState({
      title: "Remove player?",
      body: `${member.player_name || "This player"} will be removed from ${data.team.name}.`,
      confirmLabel: "Remove",
      destructive: true,
      onConfirm: async () => {
        try {
          await api.removeTeamMember(data.team.id, member.id);
          await load();
        } catch (e) {
          setError(e.message);
        }
      },
    });
  };

  const handleAcceptRequest = async (req) => {
    try {
      await api.acceptJoinRequest(data.team.id, req.id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRejectRequest = async (req) => {
    try {
      await api.rejectJoinRequest(data.team.id, req.id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCancelInvite = (invite) => {
    setConfirmState({
      title: "Cancel invitation?",
      body: "The player won't be able to accept this invite.",
      confirmLabel: "Cancel invite",
      destructive: true,
      onConfirm: async () => {
        try {
          await api.cancelInvitation(data.team.id, invite.id);
          await load();
        } catch (e) {
          setError(e.message);
        }
      },
    });
  };

  const handleLogoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
  };

  const handleCropComplete = async (blob) => {
    setCropFile(null);
    setUploading(true);
    try {
      const file = new File([blob], "team-logo.jpg", { type: "image/jpeg" });
      await api.uploadTeamLogo(data.team.id, file);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <p className="text-white/60 mb-4">{error || "Team not found"}</p>
          <Link href="/dashboard/teams" className="text-[#D4AF6A] hover:underline">
            ← Back to my teams
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { team, members, join_requests = [], sent_invitations = [] } = data;

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <Link
          href="/dashboard/teams"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to my teams
        </Link>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Header with logo */}
        <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative w-24 h-24 rounded-xl bg-[#D4AF6A]/20 flex items-center justify-center overflow-hidden">
              {team.logo_url ? (
                <Image src={team.logo_url} alt={team.name} width={96} height={96} className="object-cover" />
              ) : (
                <Shield className="w-10 h-10 text-[#D4AF6A]" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#D4AF6A] animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">{team.name}</h1>
              <p className="text-sm text-white/50 mt-1">
                {members.length} player{members.length !== 1 ? "s" : ""}
              </p>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelected}
              className="hidden"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/10 transition disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Change logo
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
          >
            <UserPlus className="w-4 h-4" /> Invite a player
          </button>
        </div>

        {/* Pending join requests */}
        {join_requests.length > 0 && (
          <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">
              Join requests ({join_requests.length})
            </h2>
            <div className="space-y-2">
              {join_requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1C1928] p-3"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] font-bold shrink-0">
                    {r.player_picture_url ? (
                      <Image src={r.player_picture_url} alt="" width={40} height={40} className="object-cover" />
                    ) : (
                      r.player_name?.[0] || "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {r.player_name || "Player"}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {r.player_position || "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(r)}
                      className="rounded-md bg-green-500/20 text-green-400 px-3 py-1.5 text-xs font-medium hover:bg-green-500/30 transition inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(r)}
                      className="rounded-md bg-red-500/20 text-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-500/30 transition inline-flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent invitations */}
        {sent_invitations.length > 0 && (
          <div className="bg-[#242030] rounded-xl border border-white/10 p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">
              Pending invitations ({sent_invitations.length})
            </h2>
            <div className="space-y-2">
              {sent_invitations.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1C1928] p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">
                      Invitation sent
                    </p>
                    <p className="text-xs text-white/50">
                      Awaiting response
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelInvite(i)}
                    className="rounded-md border border-red-500/40 text-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-500/10 transition"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Squad */}
        <div className="bg-[#242030] rounded-xl border border-white/10 p-6">
          <h2 className="text-white font-semibold mb-4">Squad ({members.length})</h2>
          {members.length === 0 ? (
            <p className="text-white/40 text-sm">No players yet.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1C1928] p-3"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] font-bold shrink-0">
                    {m.player_picture_url ? (
                      <Image src={m.player_picture_url} alt="" width={40} height={40} className="object-cover" />
                    ) : (
                      m.player_name?.[0] || "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {m.player_name || "Player"}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {m.player_position || "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m)}
                    className="rounded-md bg-red-500/20 text-red-400 p-2 hover:bg-red-500/30 transition"
                    title="Remove from team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />

      <InvitePlayerModal
        open={showInvite}
        onClose={() => {
          setShowInvite(false);
          load();
        }}
        teamId={team.id}
      />

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onCancel={() => {
            setCropFile(null);
            if (logoInputRef.current) logoInputRef.current.value = "";
          }}
          onComplete={handleCropComplete}
          aspect={1}
        />
      )}
    </div>
  );
}