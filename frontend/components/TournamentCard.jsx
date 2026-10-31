'use client';

import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';

export default function TournamentCard({ tournament }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
      case 'FILLING_TEAMS':
        return 'bg-green-500/20 text-green-400';
      case 'ALL_TEAMS_REGISTERED':
        return 'bg-[#D4AF6A]/20 text-[#D4AF6A]';
      case 'REGISTRATION_CLOSED':
      case 'IN_PROGRESS':
        return 'bg-purple-500/20 text-purple-400';
      case 'COMPLETED':
        return 'bg-blue-500/20 text-blue-400';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400';
      case 'DRAFT':
        return 'bg-white/10 text-white/50';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  const statusLabel = (tournament.status || 'UPCOMING').replace(/_/g, ' ');
  const entryFee = tournament.team_entry_fee;

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group bg-[#242030] rounded-lg p-5 border border-white/10 hover:border-[#D4AF6A]/50 transition-all hover:shadow-lg hover:shadow-[#D4AF6A]/5 flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
            tournament.status
          )}`}
        >
          {statusLabel}
        </span>
        <span className="text-xs text-white/40">
          {tournament.tournament_type || 'N/A'}
        </span>
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
          {tournament.start_date
            ? new Date(tournament.start_date).toLocaleDateString()
            : 'Date TBD'}
        </span>
      </div>
      {entryFee !== undefined && entryFee !== null && entryFee > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-white/60 text-sm">Entry fee</span>
          <span className="text-[#D4AF6A] font-semibold">
            {tournament.fee_currency || 'KES'} {Number(entryFee).toLocaleString()}
          </span>
        </div>
      )}
    </Link>
  );
}