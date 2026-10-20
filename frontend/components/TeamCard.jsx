"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Shield } from "lucide-react";

export default function TeamCard({ team, href }) {
  const link = href || `/teams/${team.id}`;
  return (
    <Link
      href={link}
      className="group bg-[#242030] rounded-lg p-5 border border-white/10 hover:border-[#D4AF6A]/50 transition-all hover:shadow-lg hover:shadow-[#D4AF6A]/5 block"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="w-14 h-14 rounded-lg bg-[#D4AF6A]/20 flex items-center justify-center text-[#D4AF6A] text-xl font-bold overflow-hidden flex-shrink-0">
          {team.logo_url ? (
            <Image
              src={team.logo_url}
              alt={team.name}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <Shield className="w-7 h-7" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white group-hover:text-[#D4AF6A] transition truncate">
            {team.name}
          </h3>
          {team.description && (
            <p className="text-sm text-white/60 truncate">{team.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-white/50">
        <Users className="w-4 h-4" />
        {team.member_count} player{team.member_count !== 1 ? "s" : ""}
      </div>
    </Link>
  );
}