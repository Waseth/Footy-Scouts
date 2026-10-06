"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Calendar, Shield, Award, Mail, Phone,
  Globe, ChevronRight, Lock, Film, Image as ImageIcon, FileText, Star,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [media, setMedia] = useState([]);
  const [mediaMeta, setMediaMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(api.isAuthenticated());
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const p = await api.getPlayer(params.id);
        setPlayer(p);

        // Try to fetch media (guests get requires_login flag back)
        try {
          const m = await api.getPlayerMedia(params.id);
          setMedia(m.media || []);
          setMediaMeta(m);
        } catch {
          setMedia([]);
        }
      } catch (err) {
        setError(err.message || "Player not found");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchAll();
  }, [params.id]);

  const handleSeeFullDetails = () => {
    const redirect = encodeURIComponent(`/players/${params.id}`);
    router.push(`/login?redirect=${redirect}&intent=view_full_profile`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="animate-pulse">
            <div className="h-8 bg-[#242030] rounded w-1/4 mb-6" />
            <div className="bg-[#242030] rounded-lg p-6 border border-white/10">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3">
                  <div className="aspect-square bg-white/10 rounded-lg" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="h-10 bg-white/10 rounded w-3/4" />
                  <div className="h-6 bg-white/10 rounded w-1/2" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Player Not Found</h1>
          <p className="text-white/60 mb-6">{error || "The player you're looking for doesn't exist."}</p>
          <Link href="/players" className="text-[#D4AF6A] hover:underline">
            ← Back to Players
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isGuestView = player.requires_login_for_full_details === true;

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/players" className="hover:text-white/60 transition">Players</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white/80">{player.full_name}</span>
        </div>

        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Players
        </Link>

        {/* Profile Card */}
        <div className="bg-[#242030] rounded-xl border border-white/10 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="w-full md:w-1/3 bg-[#1C1928] relative">
              <div className="aspect-square relative">
                {player.profile_picture_url ? (
                  <Image
                    src={player.profile_picture_url}
                    alt={player.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#2A2438]">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto rounded-full bg-[#D4AF6A]/20 flex items-center justify-center mb-4">
                        <span className="text-4xl text-[#D4AF6A]">
                          {player.full_name?.charAt(0) || "P"}
                        </span>
                      </div>
                      <p className="text-white/40 text-sm">No image available</p>
                    </div>
                  </div>
                )}
                {player.is_featured && (
                  <div className="absolute top-4 right-4 bg-[#D4AF6A] text-[#1C1928] px-3 py-1 rounded-full text-xs font-semibold">
                    ⭐ Featured
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 p-6 md:p-8">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white">{player.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {player.position && (
                      <span className="px-3 py-1 rounded-full bg-[#D4AF6A]/20 text-[#D4AF6A] text-sm font-medium">
                        {player.position}
                      </span>
                    )}
                    {player.nationality && (
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-sm">
                        {player.nationality}
                      </span>
                    )}
                    {player.is_premium && (
                      <span className="px-3 py-1 rounded-full bg-[#D4AF6A]/10 text-[#D4AF6A] text-sm font-medium flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        Premium
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-sm">Profile Views</p>
                  <p className="text-white text-xl font-semibold">{player.profile_views || 0}</p>
                </div>
              </div>

              {/* Public fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {player.nationality && (
                  <InfoRow icon={Globe} label={player.nationality} />
                )}
                {player.current_team && (
                  <InfoRow icon={Award} label={player.current_team} />
                )}
                {player.age != null && (
                  <InfoRow icon={Calendar} label={`${player.age} years old`} />
                )}
                {player.gender && (
                  <InfoRow icon={Shield} label={player.gender} />
                )}
                {player.school && (
                  <InfoRow icon={MapPin} label={player.school} />
                )}
              </div>

              {player.biography && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-2">About</h3>
                  <p className="text-white/60 leading-relaxed">{player.biography}</p>
                </div>
              )}

              {/* Locked panel for guests */}
              {isGuestView ? (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-start gap-3 rounded-lg bg-[#1C1928] border border-[#D4AF6A]/20 p-4">
                    <Lock className="w-5 h-5 text-[#D4AF6A] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        Full profile &amp; media require an account
                      </p>
                      <p className="text-white/60 text-sm mt-1">
                        Sign up free to see highlights, contact details, and more.
                      </p>
                      <button
                        onClick={handleSeeFullDetails}
                        className="mt-3 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
                      >
                        See full details
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Media section for logged-in users */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-white font-semibold mb-3">
                      Highlights &amp; Media
                    </h3>
                    {media.length === 0 ? (
                      <p className="text-white/40 text-sm">
                        No media available yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {media.map((m) => (
                          <MediaTile key={m.id} media={m} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contact (only present for owner) */}
                  {(player.contact_number || player.email) && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h3 className="text-white font-semibold mb-3">Contact</h3>
                      <div className="flex flex-wrap gap-4">
                        {player.contact_number && (
                          <InfoRow icon={Phone} label={player.contact_number} />
                        )}
                        {player.email && (
                          <InfoRow icon={Mail} label={player.email} />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function InfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 text-white/70">
      <Icon className="w-5 h-5 text-[#D4AF6A]" />
      <span>{label}</span>
    </div>
  );
}

function MediaTile({ media }) {
  const Icon =
    media.media_type === "VIDEO"
      ? Film
      : media.media_type === "PDF"
      ? FileText
      : ImageIcon;

  if (media.media_type === "IMAGE" && media.url) {
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noreferrer"
        className="block aspect-square rounded-lg overflow-hidden border border-white/10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.url}
          alt={media.title || "media"}
          className="w-full h-full object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center justify-center aspect-square rounded-lg border border-white/10 bg-[#1C1928] text-white/60 hover:text-white hover:border-[#D4AF6A]/40 transition"
    >
      <Icon className="w-6 h-6 mb-2" />
      <span className="text-xs px-2 text-center truncate w-full">
        {media.title || media.media_type}
      </span>
    </a>
  );
}