'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PlayerCard from '@/components/PlayerCard';
import CustomSelect from '@/components/CustomSelect';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [nationality, setNationality] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const positionOptions = [
    { value: '', label: 'All Positions' },
    { value: 'Goalkeeper', label: 'Goalkeeper' },
    { value: 'Centre-back', label: 'Centre-back' },
    { value: 'Full-back', label: 'Full-back' },
    { value: 'Defensive Midfielder', label: 'Defensive Midfielder' },
    { value: 'Central Midfielder', label: 'Central Midfielder' },
    { value: 'Attacking Midfielder', label: 'Attacking Midfielder' },
    { value: 'Winger', label: 'Winger' },
    { value: 'Striker', label: 'Striker' },
  ];

  useEffect(() => {
    fetchPlayers();
  }, [page, position, nationality]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const result = await api.getPlayers({
        page,
        per_page: 12,
        position: position || undefined,
        nationality: nationality || undefined,
      });
      setPlayers(result.items || []);
      setTotal(result.total || 0);
      setTotalPages(result.pages || 1);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPlayers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setPosition('');
    setNationality('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#D4AF6A]">Players</h1>
          <p className="text-white mt-1">Discover talented football players from around the world</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#242030] rounded-lg p-6 border border-white/10 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, position, or nationality..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <CustomSelect
                value={position}
                onChange={setPosition}
                options={positionOptions}
                placeholder="All Positions"
                className="min-w-[150px]"
              />
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Nationality"
                className="px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition w-40"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-[#D4AF6A] text-[#1C1928] hover:bg-[#D4AF6A]/90 transition cursor-pointer"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-white/60 text-sm">
          {loading ? 'Loading...' : `Showing ${players.length} of ${total} players`}
        </div>

        {/* Players Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#242030] rounded-lg p-5 border border-white/10 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-white/10" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-white/10 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white text-lg">No players found</p>
            <p className="text-white/40 text-sm mt-1">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white/60 px-4">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
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