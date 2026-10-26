"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Shield, Users, Loader2, UserPlus, Trash2, Check, X, Upload,
  Trophy, MapPin, Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InvitePlayerModal from "@/components/InvitePlayerModal";
import ConfirmModal from "@/components/ConfirmModal";
import ImageCropModal from "@/components/ImageCropModal";
import ThemedAlert from "@/components/ThemedAlert";

export default function ManageTeamPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [error, setError] = useState("");

  const [acceptingTournament, setAcceptingTournament] = useState(null);
  const [decliningTournament, setDecliningTournament] = useState(null);
  const [payingEntry, setPayingEntry] = useState(null);

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
          setAlert({ title: "Could not remove", body: e.message, variant: "danger" });
        }
      },
    });
  };

  const handleAcceptRequest = async (req) => {
    try {
      await api.acceptJoinRequest(data.team.id, req.id);
      await load();
    } catch (e) {
      setAlert({ title: "Could not accept", body: e.message, variant: "danger" });
    }
  };

  const handleRejectRequest = async (req) => {
    try {
      await api.rejectJoinRequest(data.team.id, req.id);
      await load();
    } catch (e) {
      setAlert({ title: "Could not reject", body: e.message, variant: "danger" });
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
          setAlert({ title: "Could not cancel", body: e.message, variant: "danger" });
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
      setAlert({ title: "Logo upload failed", body: e.message, variant: "danger" });
    } finally {
      setUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // Tournament invite handling
  const handleAcceptTournamentInvite = async (inv) => {
    setAcceptingTournament(inv.id);
    try {
      await api.acceptTournamentInvite(data.team.id, inv.id);
      await load();
      setAlert({
        title: "Tournament invitation accepted",
        body: `Your team is now accepted into ${inv.tournament_name}. Next step: complete your squad and pay the entry fee.`,
        variant: "success",
      });
    } catch (e) {
      setAlert({
        title: "Could not accept invitation",
        body: e.message || "Try again.",
        variant: "danger",
      });
    } finally {
      setAcceptingTournament(null);
    }
  };

  const handleDeclineTournamentInvite = async (inv) => {
    setConfirmState({
      title: "Decline tournament invitation?",
      body: `Your team will not participate in ${inv.tournament_name}.`,
      confirmLabel: "Decline",
      destructive: true,
      onConfirm: async () => {
        setDecliningTournament(inv.id);
        try {
          await api.declineTournamentInvite(data.team.id, inv.id);
          await load();
        } catch (e) {
          setAlert({
            title: "Could not decline invitation",
            body: e.message,
            variant: "danger",
          });
        } finally {
          setDecliningTournament(null);
        }
      },
    });
  };

  // Pay entry fee for a tournament
  const handlePayEntryFee = async (entry) => {
    setPayingEntry(entry.id);
    try {
      const res = await api.initializeTeamEntryPayment(data.team.id, entry.tournament_id);
      window.location.href = res.authorization_url;
    } catch (e) {
      setAlert({
        title: "Could not start payment",
        body: e.message || "Please try again.",
        variant: "danger",
      });
      setPayingEntry(null);
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

  const {
    team, members, join_requests = [], sent_invitations = [],
    tournament_invitations = [], tournament_entries = [],
  } = data;

  const payableEntries = tournament_entries.filter(
    (e) => e.status === "ACCEPTED" || e.status === "REGISTERED"
  );

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
                <Image
                  src={team.logo_url}
                  alt={team.name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
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

        {/* Tournament invitations */}
        {tournament_invitations.length > 0 && (
          <div className="bg-[#242030] rounded-xl border border-[#D4AF6A]/40 p-6 mb-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D4AF6A]" />
              Tournament invitations ({tournament_invitations.length})
            </h2>
            <div className="space-y-3">
              {tournament_invitations.map((inv) => {
                const meetsMin = (members.length || 0) >= (inv.min_players_per_team || 0);
                const shortfall = (inv.min_players_per_team || 0) - (members.length || 0);

                return (
                  <div
                    key={inv.id}
                    className="rounded-lg border border-white/10 bg-[#1C1928] p-4"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold">
                          {inv.tournament_name || "Tournament"}
                        </h3>
                        {inv.tournament_type && (
                          <p className="text-xs text-white/50 mt-0.5">
                            {inv.tournament_type}
                          </p>
                        )}
                      </div>
                      {inv.team_entry_fee > 0 && (
                        <span className="text-xs text-[#D4AF6A] font-medium">
                          {inv.fee_currency} {inv.team_entry_fee.toLocaleString()} entry
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-white/50 mb-3">
                      {inv.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {inv.location}
                        </span>
                      )}
                      {inv.start_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(inv.start_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div
                      className={`rounded-md border px-3 py-2 mb-3 text-xs ${
                        meetsMin
                          ? "border-green-500/20 bg-green-500/5 text-green-400"
                          : "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
                      }`}
                    >
                      {meetsMin ? (
                        <>✓ Squad meets the minimum of {inv.min_players_per_team} players</>
                      ) : (
                        <>
                          ⚠ Your squad has {members.length} player
                          {members.length !== 1 ? "s" : ""}. Add{" "}
                          {shortfall} more to accept — tournament requires a
                          minimum of {inv.min_players_per_team}.
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptTournamentInvite(inv)}
                        disabled={!meetsMin || acceptingTournament === inv.id}
                        className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                          meetsMin
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-white/10 text-white/30 cursor-not-allowed"
                        } disabled:opacity-50`}
                        title={meetsMin ? "Accept invite" : "Fill your squad first"}
                      >
                        {acceptingTournament === inv.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        {meetsMin ? "Accept" : "Squad too small"}
                      </button>
                      <button
                        onClick={() => handleDeclineTournamentInvite(inv)}
                        disabled={decliningTournament === inv.id}
                        className="inline-flex items-center gap-1 rounded-md bg-red-500/20 text-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-500/30 transition disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tournament registrations — pay / registered */}
        {payableEntries.length > 0 && (
          <div className="bg-[#242030] rounded-xl border border-[#D4AF6A]/40 p-6 mb-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D4AF6A]" />
              Tournament registrations
            </h2>
            <div className="space-y-3">
              {payableEntries.map((entry) => {
                const isRegistered = entry.status === "REGISTERED";
                const squad = members.length;
                const tooSmall = squad < entry.min_players_per_team;
                const tooBig = squad > entry.max_players_per_team;
                const total = entry.team_entry_fee + entry.platform_fee_per_team;
                const paying = payingEntry === entry.id;

                return (
                  <div key={entry.id} className="rounded-lg border border-white/10 bg-[#1C1928] p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold">
                          {entry.tournament_name || "Tournament"}
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                          {isRegistered
                            ? "✓ Registered — payment received"
                            : "Accepted — awaiting payment"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/50">Total to pay</p>
                        <p className="text-[#D4AF6A] font-semibold">
                          {entry.fee_currency} {total.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          (incl. {entry.platform_fee_per_team.toLocaleString()} platform fee)
                        </p>
                      </div>
                    </div>

                    {isRegistered ? (
                      <p className="text-xs text-green-400 mt-2">
                        Paid
                        {entry.registered_at
                          ? ` · ${new Date(entry.registered_at).toLocaleDateString()}`
                          : ""}
                      </p>
                    ) : (
                      <>
                        <div
                          className={`rounded-md border px-3 py-2 mb-3 text-xs ${
                            tooSmall
                              ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
                              : tooBig
                              ? "border-red-500/20 bg-red-500/5 text-red-400"
                              : "border-green-500/20 bg-green-500/5 text-green-400"
                          }`}
                        >
                          {tooSmall && (
                            <>
                              ⚠ Add {entry.min_players_per_team - squad} more player(s).
                              Minimum is {entry.min_players_per_team}.
                            </>
                          )}
                          {tooBig && (
                            <>
                              ⚠ Remove {squad - entry.max_players_per_team} player(s).
                              Maximum is {entry.max_players_per_team}.
                            </>
                          )}
                          {!tooSmall && !tooBig && (
                            <>✓ Squad size OK ({squad} players). You can pay now.</>
                          )}
                        </div>
                        <button
                          onClick={() => handlePayEntryFee(entry)}
                          disabled={!entry.can_pay || paying}
                          className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {paying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trophy className="w-4 h-4" />
                          )}
                          {paying
                            ? "Starting checkout…"
                            : `Pay ${entry.fee_currency} ${total.toLocaleString()}`}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add player */}
        <div className="mb-6">
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
          >
            <UserPlus className="w-4 h-4" /> Invite a player
          </button>
        </div>

        {/* Join requests */}
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
                      <Image
                        src={r.player_picture_url}
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover"
                      />
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
              Pending player invitations ({sent_invitations.length})
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
                    <p className="text-xs text-white/50">Awaiting response</p>
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
          <h2 className="text-white font-semibold mb-4">
            Squad ({members.length})
          </h2>
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
                      <Image
                        src={m.player_picture_url}
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover"
                      />
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

      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}