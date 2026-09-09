'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomSelect from '@/components/CustomSelect';

export default function ScoutsPage() {
  const [scouts, setScouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scoutType, setScoutType] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const scoutTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'INDIVIDUAL', label: 'Individual' },
    { value: 'AGENCY', label: 'Agency' },
  ];

  useEffect(() => {
    fetchScouts();
  }, [page, scoutType, country]);

  const fetchScouts = async () => {
    setLoading(true);
    try {
      const result = await api.getScouts({
        page,
        per_page: 12,
        scout_type: scoutType || undefined,
        country: country || undefined,
      });
      setScouts(result.items || []);
      setTotal(result.total || 0);
      setTotalPages(result.pages || 1);
    } catch (error) {
      console.error('Failed to fetch scouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchScouts();
  };

  const handleClearFilters = () => {
    setSearch('');
    setScoutType('');
    setCountry('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-20 sm:pt-24">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF6A]">Scouts & Agents</h1>
          <p className="text-white mt-1 text-sm sm:text-base">Connect with verified scouts and agencies</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#242030] rounded-lg p-4 sm:p-6 border border-white/10 mb-6 sm:mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search scouts by name or agency..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <CustomSelect
                value={scoutType}
                onChange={setScoutType}
                options={scoutTypeOptions}
                placeholder="All Types"
                className="flex-1 min-w-[120px] max-w-[160px] sm:max-w-[180px]"
              />
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                className="flex-1 min-w-[100px] max-w-[140px] sm:max-w-[160px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition text-sm sm:text-base"
              />
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-[#D4AF6A] text-[#1C1928] hover:bg-[#D4AF6A]/90 transition cursor-pointer text-sm sm:text-base whitespace-nowrap"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition cursor-pointer text-sm sm:text-base whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-3 sm:mb-4 text-white/60 text-sm sm:text-base">
          {loading ? 'Loading...' : `Showing ${scouts.length} of ${total} scouts`}
        </div>

        {/* Scouts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#242030] rounded-lg p-4 sm:p-5 border border-white/10 animate-pulse">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10" />
                  <div className="flex-1">
                    <div className="h-3 sm:h-4 bg-white/10 rounded w-3/4 mb-1 sm:mb-2" />
                    <div className="h-2 sm:h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-2 sm:h-3 bg-white/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : scouts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-white text-base sm:text-lg">No scouts found</p>
            <p className="text-white/40 text-sm mt-1">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {scouts.map((scout) => (
              <Link
                key={scout.id}
                href={`/scouts/${scout.id}`}
                className="bg-[#242030] rounded-lg p-4 sm:p-5 border border-white/10 hover:border-[#D4AF6A]/50 transition group"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] text-lg sm:text-xl font-bold overflow-hidden flex-shrink-0">
                    {scout.profile_picture_url ? (
                      <img src={scout.profile_picture_url} alt={scout.scout_name} className="w-full h-full object-cover" />
                    ) : (
                      scout.scout_name?.charAt(0) || 'S'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-[#D4AF6A] transition text-sm sm:text-base truncate">
                      {scout.scout_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60 truncate">
                      {scout.scout_type === 'AGENCY' ? scout.agency_name : 'Independent Scout'}
                      {scout.is_verified && (
                        <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4AF6A] flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-white/40 truncate">
                  {scout.city}, {scout.country}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <span className="text-white/60 px-3 sm:px-4 text-sm sm:text-base">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}