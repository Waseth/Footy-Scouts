'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

export default function ScoutCard({ scout }) {
  return (
    <Link
      href={`/scouts/${scout.id}`}
      className="group bg-[#242030] rounded-lg p-5 border border-white/10 hover:border-[#D4AF6A]/50 transition-all hover:shadow-lg hover:shadow-[#D4AF6A]/5"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] text-xl font-bold overflow-hidden flex-shrink-0">
          {scout.profile_picture_url ? (
            <Image
              src={scout.profile_picture_url}
              alt={scout.scout_name || 'Scout'}
              width={56}
              height={56}
              className="object-cover"
            />
          ) : (
            scout.scout_name?.charAt(0) || 'S'
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white group-hover:text-[#D4AF6A] transition truncate">
              {scout.scout_name || 'Unknown Scout'}
            </h3>
            {scout.is_verified && (
              <ShieldCheck className="w-4 h-4 text-[#D4AF6A] flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-white/60 truncate">
            {scout.scout_type === 'AGENCY' ? scout.agency_name : 'Independent Scout'}
          </p>
        </div>
      </div>
      <p className="text-sm text-white/40 truncate">
        {scout.city || 'Unknown'}, {scout.country || 'Unknown'}
      </p>
    </Link>
  );
}