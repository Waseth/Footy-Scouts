'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tournamentType, setTournamentType] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const types = ['5-a-side', '7-a-side', '9-a-side', '11-a-side'];

  useEffect(() => {
    fetchTournaments();
  }, [page, tournamentType, location]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const result = await api.getTournaments({
        page,
        per_page: 9,
        type: tournamentType || undefined,
        location: location || undefined,
      });
      setTournaments(result.items || []);
      setTotal(result.total || 0);
      setTotalPages(result.pages || 1);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setTournamentType('');
    setLocation('');
    setPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING': return 'bg-green-500/20 text-green-400';
      case 'ONGOING': return 'bg-yellow-500/20 text-yellow-400';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-white/10 text-white/60';
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Tournaments</h1>
            <p className="text-white/60 mt-1">Find and register for upcoming tournaments</p>
          </div>
          <Link
            href="/tournaments/create"
            className="px-6 py-2.5 rounded-lg bg-[#D4AF6A] text-[#1C1928] font-semibold hover:bg-[#D4AF6A]/90 transition text-center"
          >
            + Create Tournament
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-[#242030] rounded-lg p-6 border border-white/10 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-3 flex-wrap">
              <select
                value={tournamentType}
                onChange={(e) => setTournamentType(e.target.value)}
                className="px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white focus:border-[#D4AF6A]/60 outline-none transition"
              >
                <option value="">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition w-40"
              />
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-white/60 text-sm">
          {loading ? 'Loading...' : `Showing ${tournaments.length} of ${total} tournaments`}
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#242030] rounded-lg p-6 border border-white/10 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-3" />
                <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
                <div className="flex gap-4">
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">No tournaments found</p>
            <p className="text-white/40 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                  <span className="text-xs text-white/40">{tournament.tournament_type}</span>
                </div>
                <h3 className="text-white font-semibold text-lg group-hover:text-[#D4AF6A] transition mb-1">
                  {tournament.tournament_name}
                </h3>
                <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{tournament.location}</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                </div>
                {tournament.registration_fee > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white/60 text-sm">Fee</span>
                    <span className="text-[#D4AF6A] font-semibold">
                      {tournament.fee_currency} {tournament.registration_fee}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white/60 px-4">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}