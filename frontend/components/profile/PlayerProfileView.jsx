import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import InfoRow from "./InfoRow";
import Accordion from "./Accordion";
import { calculateAge, formatDate } from "@/lib/profileData";

export default function PlayerProfileView({ player }) {
  const age = calculateAge(player.date_of_birth);
  const born = formatDate(player.date_of_birth);
  const subtitle = [player.position, player.nationality].filter(Boolean).join(" · ");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1C1928]">
      {/* Background watermark — swap the placeholder box for your logo <Image/>.
          Positioned/sized independently of content so it isn't dependent on
          leftover whitespace to stay visible. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* <div className="flex h-105 w-105 items-center justify-center rounded-full border-[3px] border-dashed border-white/10 text-sm font-medium tracking-wide text-white/10 sm:h-160 sm:w-160">
          LOGO WATERMARK
        </div> */}
        
          <Image
            src="/logo-modified.png"
            alt="FootyScouts"
            fill
            loading="eager"
            sizes="(min-width: 640px) 640px, 420px"
            className="object-contain opacity-[0.14]"
            aria-hidden
          />
       
      </div>

      {/* ===== Desktop — Wikipedia-style article + infobox ===== */}
      <div className="relative z-10 hidden sm:block">
        <div className="container mx-auto px-6 py-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center gap-2 text-sm text-white/50">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight size={14} />
              <Link href="/players" className="hover:text-white">Players</Link>
              <ChevronRight size={14} />
              <span className="text-white/80">{player.full_name}</span>
            </div>

            <div className="border-b border-white/10 pb-3">
              <h1 className="text-4xl font-bold text-white">{player.full_name}</h1>
              {subtitle && <p className="mt-1 text-base italic text-white/50">{subtitle}</p>}
            </div>

            <div className="mt-8">
              {/* Infobox — floats right, article text wraps around it like a wiki page */}
              <div className="mb-6 ml-6 w-72 float-right overflow-hidden rounded-lg border border-white/10 bg-[#1C1928]/80 backdrop-blur-sm">
                <div className="relative h-72 w-full">
                  <Image
                    src={player.profile_picture_url}
                    alt={player.full_name}
                    fill
                    loading="eager"
                    sizes="288px"
                    className="object-cover"
                  />
                </div>
                <div className="gold-font border-b border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide">
                  Quick Facts
                </div>
                <div className="px-4 py-2">
                  <InfoRow label="Position" value={player.position} />
                  <InfoRow label="Nationality" value={player.nationality} />
                  <InfoRow label="Born" value={born ? `${born}${age !== null ? ` (age ${age})` : ""}` : null} />
                  <InfoRow label="Current Team" value={player.current_team} />
                  <InfoRow label="School" value={player.school} />
                </div>
              </div>

              <h2 className="mb-3 border-b border-white/10 pb-1 text-2xl font-bold text-white">About</h2>
              <p className="text-base leading-8 text-white/70">{player.biography}</p>

              {player.show_contact && (
                <>
                  <h2 className="mb-3 mt-10 border-b border-white/10 pb-1 text-2xl font-bold text-white">Contact</h2>
                  <InfoRow label="Phone" value={player.contact_number} />
                  <InfoRow label="Email" value={player.email} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Mobile — Google knowledge-panel style ===== */}
      <div className="relative z-10 sm:hidden">
        <div className="px-5 pb-4 pt-8 text-center">
          <div className="relative mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-2 border-white/10">
            <Image src={player.profile_picture_url} alt={player.full_name} fill sizes="112px" className="object-cover" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-bold text-white">{player.full_name}</h1>
            {player.is_featured && <ShieldCheck size={16} className="text-[#D4AF6A]" />}
          </div>
          {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
        </div>

        <div className="flex justify-center gap-6 border-y border-white/10 bg-[#1C1928]/80 py-4 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-xs text-white/40">Born</p>
            <p className="text-sm font-medium text-white">{age !== null ? `${age} yrs` : "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/40">Team</p>
            <p className="text-sm font-medium text-white">{player.current_team || "—"}</p>
          </div>
        </div>

        <div className="bg-[#1C1928]/80 px-5 backdrop-blur-sm">
          <Accordion title="About" defaultOpen>
            {player.biography}
          </Accordion>
          <Accordion title="Details">
            <InfoRow label="Position" value={player.position} />
            <InfoRow label="Nationality" value={player.nationality} />
            <InfoRow label="Born" value={born} />
            <InfoRow label="Current Team" value={player.current_team} />
            <InfoRow label="School" value={player.school} />
          </Accordion>
          {player.show_contact && (
            <Accordion title="Contact">
              <InfoRow label="Phone" value={player.contact_number} />
              <InfoRow label="Email" value={player.email} />
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}