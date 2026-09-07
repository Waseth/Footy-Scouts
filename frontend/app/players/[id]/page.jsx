'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Shield,
  Award,
  Mail,
  Phone,
  Globe,
  Star,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const id = params.id;
        const data = await api.getPlayer(id);
        setPlayer(data);
      } catch (err) {
        setError(err.message || 'Player not found');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPlayer();
    }
  }, [params.id]);

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
          <p className="text-white/60 mb-6">{error || 'The player you\'re looking for doesn\'t exist.'}</p>
          <Link href="/players" className="text-[#D4AF6A] hover:underline">
            ← Back to Players
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const age = player.age || '—';

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

        {/* Back Button */}
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Players
        </Link>

        {/* Player Profile */}
        <div className="bg-[#242030] rounded-xl border border-white/10 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left - Image */}
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
                          {player.full_name?.charAt(0) || 'P'}
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

            {/* Right - Details */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {player.nationality && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Globe className="w-5 h-5 text-[#D4AF6A]" />
                    <span>{player.nationality}</span>
                  </div>
                )}
                {player.age && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Calendar className="w-5 h-5 text-[#D4AF6A]" />
                    <span>{player.age} years old</span>
                  </div>
                )}
                {player.gender && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Shield className="w-5 h-5 text-[#D4AF6A]" />
                    <span>{player.gender}</span>
                  </div>
                )}
                {player.current_team && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Award className="w-5 h-5 text-[#D4AF6A]" />
                    <span>{player.current_team}</span>
                  </div>
                )}
                {player.school && (
                  <div className="flex items-center gap-3 text-white/70">
                    <MapPin className="w-5 h-5 text-[#D4AF6A]" />
                    <span>{player.school}</span>
                  </div>
                )}
              </div>

              {player.biography && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-2">About</h3>
                  <p className="text-white/60 leading-relaxed">{player.biography}</p>
                </div>
              )}

              {/* Contact - Only if premium */}
              {player.is_premium && player.contact_number && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-white font-semibold mb-3">Contact</h3>
                  <div className="flex flex-wrap gap-4">
                    {player.contact_number && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Phone className="w-5 h-5 text-[#D4AF6A]" />
                        <span>{player.contact_number}</span>
                      </div>
                    )}
                    {player.email && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Mail className="w-5 h-5 text-[#D4AF6A]" />
                        <span>{player.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}