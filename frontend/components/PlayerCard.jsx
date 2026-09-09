'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PlayerCard({ player }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="group bg-[#242030] rounded-lg p-4 md:p-5 border border-white/10 hover:border-[#D4AF6A]/50 transition-all hover:shadow-lg hover:shadow-[#D4AF6A]/5"
    >
      <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] text-lg md:text-xl font-bold overflow-hidden flex-shrink-0">
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
          <h3 className="font-semibold text-white group-hover:text-[#D4AF6A] transition truncate text-sm md:text-base">
            {player.full_name || 'Unknown Player'}
          </h3>
          <p className="text-xs md:text-sm text-white/60 truncate">
            {player.position || 'No position'} · {player.nationality || 'Unknown'}
          </p>
        </div>
      </div>
      <div className="space-y-1 text-xs md:text-sm">
        {player.current_team && (
          <p className="text-white/70 truncate">{player.current_team}</p>
        )}
        <div className="flex items-center gap-2 md:gap-3 text-white/40">
          <span>{player.age ? `${player.age} years` : 'Age N/A'}</span>
          {player.is_featured && (
            <span className="text-[#D4AF6A] text-[10px] md:text-xs font-medium">⭐ Featured</span>
          )}
        </div>
      </div>
    </Link>
  );
}