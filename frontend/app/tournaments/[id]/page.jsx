'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Users,
  DollarSign,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const id = params.id;
        const data = await api.getTournament(id);
        setTournament(data);
      } catch (err) {
        setError(err.message || 'Tournament not found');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTournament();
    }
  }, [params.id]);

  const handleRegister = async () => {
    // TODO: Implement tournament registration
    setRegistered(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UPCOMING':
        return { icon: Clock, text: 'Upcoming', color: 'text-green-400 bg-green-500/20' };
      case 'ONGOING':
        return { icon: AlertCircle, text: 'Ongoing', color: 'text-yellow-400 bg-yellow-500/20' };
      case 'COMPLETED':
        return { icon: CheckCircle, text: 'Completed', color: 'text-blue-400 bg-blue-500/20' };
      case 'CANCELLED':
        return { icon: XCircle, text: 'Cancelled', color: 'text-red-400 bg-red-500/20' };
      default:
        return { icon: AlertCircle, text: status, color: 'text-white/60 bg-white/10' };
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/10 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Tournament Not Found</h1>
          <p className="text-white/60 mb-6">{error || 'The tournament you\'re looking for doesn\'t exist.'}</p>
          <Link href="/tournaments" className="text-[#D4AF6A] hover:underline">
            ← Back to Tournaments
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const StatusBadge = getStatusBadge(tournament.status);
  const StatusIcon = StatusBadge.icon;

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/tournaments" className="hover:text-white/60 transition">Tournaments</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white/80">{tournament.tournament_name}</span>
        </div>

        {/* Back Button */}
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tournaments
        </Link>

        {/* Tournament Details */}
        <div className="bg-[#242030] rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{tournament.tournament_name}</h1>
                <p className="text-white/60 mt-1">{tournament.organization_name}</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${StatusBadge.color}`}>
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{StatusBadge.text}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="w-5 h-5 text-[#D4AF6A]" />
                <span>{tournament.location}</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Calendar className="w-5 h-5 text-[#D4AF6A]" />
                <span>
                  {new Date(tournament.start_date).toLocaleDateString()}
                  {tournament.end_date && ` - ${new Date(tournament.end_date).toLocaleDateString()}`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Trophy className="w-5 h-5 text-[#D4AF6A]" />
                <span>{tournament.tournament_type}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-[#1C1928] rounded-lg">
              <div>
                <p className="text-white/40 text-sm">Registration Fee</p>
                <p className="text-white font-semibold text-lg">
                  {tournament.registration_fee > 0
                    ? `${tournament.fee_currency} ${tournament.registration_fee}`
                    : 'Free'}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Participants</p>
                <p className="text-white font-semibold text-lg">{tournament.participant_count || 0}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Status</p>
                <p className="text-white font-semibold text-lg">{StatusBadge.text}</p>
              </div>
            </div>

            {tournament.description && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2">About This Tournament</h3>
                <p className="text-white/60 leading-relaxed">{tournament.description}</p>
              </div>
            )}

            {/* Registration Button */}
            {tournament.status === 'UPCOMING' && (
              <div className="pt-6 border-t border-white/10">
                {registered ? (
                  <div className="flex items-center gap-3 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>You are registered for this tournament!</span>
                  </div>
                ) : (
                  <Link
                    href={`/tournaments/${tournament.id}/register`}
                    className="inline-block px-8 py-3 rounded-lg bg-[#D4AF6A] text-[#1C1928] font-semibold hover:bg-[#D4AF6A]/90 transition"
                  >
                    Register Now
                  </Link>
                )}
              </div>
            )}

            {tournament.status === 'CANCELLED' && (
              <div className="pt-6 border-t border-white/10 text-white/40">
                <XCircle className="w-5 h-5 inline mr-2" />
                This tournament has been cancelled.
              </div>
            )}

            {tournament.status === 'COMPLETED' && (
              <div className="pt-6 border-t border-white/10 text-white/40">
                <CheckCircle className="w-5 h-5 inline mr-2" />
                This tournament has been completed.
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}