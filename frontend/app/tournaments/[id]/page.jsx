'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, MapPin, Trophy, Users, DollarSign,
  Clock, ChevronRight, CheckCircle, XCircle, AlertCircle,
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
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(api.isAuthenticated());
  }, []);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const data = await api.getTournament(params.id);
        setTournament(data);
      } catch (err) {
        setError(err.message || 'Tournament not found');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchTournament();
  }, [params.id]);

  const handleRegister = () => {
    if (!api.isAuthenticated()) {
      router.push(
        '/login?redirect=' +
          encodeURIComponent('/tournaments') +
          '&intent=register_tournament'
      );
      return;
    }
    alert('Team registration will be available soon.');
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
        return { icon: AlertCircle, text: status || 'Unknown', color: 'text-white/60 bg-white/10' };
    }
  };

  const backHref = isAuthed ? '/tournaments' : '/';
  const backLabel = isAuthed ? 'Back to tournaments' : 'Back home';

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
                  <div key={i} className="h-24 bg-white/10 rounded" />
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
          <p className="text-white/60 mb-6">
            {error || "The tournament you're looking for doesn't exist."}
          </p>
          <Link href="/" className="text-[#D4AF6A] hover:underline">← Back home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const badge = getStatusBadge(tournament.status);
  const StatusIcon = badge.icon;

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <ChevronRight className="w-4 h-4" />
          {isAuthed ? (
            <>
              <Link href="/tournaments" className="hover:text-white/60 transition">Tournaments</Link>
              <ChevronRight className="w-4 h-4" />
            </>
          ) : null}
          <span className="text-white/80">{tournament.tournament_name}</span>
        </div>

        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> {backLabel}
        </Link>

        <div className="bg-[#242030] rounded-xl border border-white/10 p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" /> {badge.text}
                </span>
                <span className="text-xs text-white/40">{tournament.tournament_type}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                {tournament.tournament_name}
              </h1>
              <p className="text-white/60 text-sm">Organized by {tournament.organization_name}</p>
            </div>
          </div>

          {tournament.description && (
            <p className="text-white/70 leading-relaxed mb-6">{tournament.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DetailCard icon={MapPin} label="Location" value={tournament.location || 'TBD'} />
            <DetailCard
              icon={Calendar}
              label="Start date"
              value={tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}
            />
            <DetailCard
              icon={Calendar}
              label="Registration deadline"
              value={tournament.registration_deadline ? new Date(tournament.registration_deadline).toLocaleDateString() : 'TBD'}
            />
            <DetailCard
              icon={DollarSign}
              label="Entry fee"
              value={tournament.registration_fee ? `${tournament.fee_currency} ${tournament.registration_fee}` : 'Free'}
            />
          </div>
        </div>

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

        <div className="bg-[#242030] rounded-xl border border-[#D4AF6A]/30 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-[#D4AF6A] p-3 text-[#1C1928] shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-1">
                Register for this tournament
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Team registration opens soon. Registration happens as a captain with a full squad.
              </p>
              <button
                onClick={handleRegister}
                className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-2.5 font-medium hover:bg-[#D4AF6A]/90 transition"
              >
                Register team <ChevronRight className="w-4 h-4" />
              </button>
              {!isAuthed && (
                <p className="mt-3 text-xs text-white/40">
                  You&apos;ll be asked to log in or create an account first.
                </p>
              )}
            </div>
          </div>
        </div>

        {tournament.participant_count !== undefined && (
          <div className="mt-6 flex items-center gap-2 text-white/40 text-sm">
            <Users className="w-4 h-4" />
            {tournament.participant_count} participant{tournament.participant_count !== 1 ? 's' : ''} so far
          </div>
        )}
      </div>
      <Footer />
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