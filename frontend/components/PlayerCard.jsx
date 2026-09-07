'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PlayerCard({ player }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="group bg-[#242030] rounded-lg p-5 border border-white/10 hover:border-[#D4AF6A]/50 transition-all hover:shadow-lg hover:shadow-[#D4AF6A]/5"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] text-xl font-bold overflow-hidden flex-shrink-0">
          {player.profile_picture_url ? (
            <Image
              src={player.profile_picture_url}
              alt={player.full_name || 'Player'}
              width={56}
              height={56}
              className="object-cover"
            />
          ) : (
            player.full_name?.charAt(0) || 'P'
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-white group-hover:text-[#D4AF6A] transition truncate">
            {player.full_name || 'Unknown Player'}
          </h3>
          <p className="text-sm text-white/60 truncate">
            {player.position || 'No position'} · {player.nationality || 'Unknown'}
          </p>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        {player.current_team && (
          <p className="text-white/70 truncate">{player.current_team}</p>
        )}
        <div className="flex items-center gap-3 text-white/40">
          <span>{player.age ? `${player.age} years` : 'Age N/A'}</span>
          {player.is_featured && (
            <span className="text-[#D4AF6A] text-xs font-medium">⭐ Featured</span>
          )}
        </div>
      </div>
    </Link>
  );
}