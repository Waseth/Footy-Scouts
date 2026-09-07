'use client';

import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';

export default function TournamentCard({ tournament }) {
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
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group bg-[#242030] rounded-lg p-5 border border-white/10 hover:border-[#D4AF6A]/50 transition-all hover:shadow-lg hover:shadow-[#D4AF6A]/5"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
          {tournament.status || 'UPCOMING'}
        </span>
        <span className="text-xs text-white/40">{tournament.tournament_type || 'N/A'}</span>
      </div>
      <h3 className="text-white font-semibold text-base group-hover:text-[#D4AF6A] transition mb-2 line-clamp-1">
        {tournament.tournament_name || 'Untitled Tournament'}
      </h3>
      <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{tournament.location || 'Location TBD'}</span>
      </div>
      <div className="flex items-center gap-2 text-white/40 text-sm">
        <Calendar className="w-4 h-4 flex-shrink-0" />
        <span>
          {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'Date TBD'}
        </span>
      </div>
      {tournament.registration_fee !== undefined && tournament.registration_fee > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-white/60 text-sm">Fee</span>
          <span className="text-[#D4AF6A] font-semibold">
            {tournament.fee_currency || 'KES'} {tournament.registration_fee}
          </span>
        </div>
      )}
    </Link>
  );
}