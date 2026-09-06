import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import InfoRow from "./InfoRow";
import Accordion from "./Accordion";

export default function ScoutProfileView({ scout }) {
  const subtitle = [
    scout.scout_type === "AGENCY" ? scout.agency_name : "Independent Scout",
    scout.city,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1C1928]">
      {/* Background watermark — swap for your logo <Image/> once you have it */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Image
          src="/logo-modified.png"
          alt="FootyScouts"
          fill
          className="object-contain opacity-[0.14]"
          aria-hidden
          loading="eager"
        />
      </div>

      {/* ===== Desktop — Wikipedia-style article + infobox ===== */}
      <div className="relative z-10 hidden sm:block">
        <div className="container mx-auto px-6 py-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center gap-2 text-sm text-white/50">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight size={14} />
              <Link href="/scouts" className="hover:text-white">Scouts</Link>
              <ChevronRight size={14} />
              <span className="text-white/80">{scout.scout_name}</span>
            </div>

            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <h1 className="text-4xl font-bold text-white">{scout.scout_name}</h1>
              {scout.is_verified && <ShieldCheck size={22} className="text-[#D4AF6A]" />}
            </div>
            {subtitle && <p className="mt-1 text-base italic text-white/50">{subtitle}</p>}

            <div className="mt-8">
              <div className="mb-6 ml-6 w-72 float-right overflow-hidden rounded-lg border border-white/10 bg-[#1C1928]/80 backdrop-blur-sm">
                <div className="relative h-72 w-full">
                  <Image src={scout.profile_picture_url} alt={scout.scout_name} fill sizes="288px" className="object-cover" />
                </div>
                <div className="gold-font border-b border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide">
                  Quick Facts
                </div>
                <div className="px-4 py-2">
                  <InfoRow label="Type" value={scout.scout_type === "AGENCY" ? "Agency" : "Individual"} />
                  <InfoRow label="Agency" value={scout.agency_name} />
                  <InfoRow label="Country" value={scout.country} />
                  <InfoRow label="City" value={scout.city} />
                  <InfoRow label="Verified" value={scout.is_verified ? "Yes" : "Pending"} />
                </div>
              </div>

              <h2 className="mb-3 border-b border-white/10 pb-1 text-2xl font-bold text-white">About</h2>
              <p className="text-base leading-8 text-white/70">{scout.biography}</p>

              {scout.show_contact && (
                <>
                  <h2 className="mb-3 mt-10 border-b border-white/10 pb-1 text-2xl font-bold text-white">Contact</h2>
                  <InfoRow label="Phone" value={scout.contact_number} />
                  <InfoRow label="Email" value={scout.email} />
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
            <Image src={scout.profile_picture_url} alt={scout.scout_name} fill sizes="112px" className="object-cover" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-bold text-white">{scout.scout_name}</h1>
            {scout.is_verified && <ShieldCheck size={16} className="text-[#D4AF6A]" />}
          </div>
          {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
        </div>

        <div className="flex justify-center gap-6 border-y border-white/10 bg-[#1C1928]/80 py-4 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-xs text-white/40">Type</p>
            <p className="text-sm font-medium text-white">
              {scout.scout_type === "AGENCY" ? "Agency" : "Individual"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/40">Based in</p>
            <p className="text-sm font-medium text-white">{scout.city || "—"}</p>
          </div>
        </div>

        <div className="bg-[#1C1928]/80 px-5 backdrop-blur-sm">
          <Accordion title="About" defaultOpen>
            {scout.biography}
          </Accordion>
          <Accordion title="Details">
            <InfoRow label="Type" value={scout.scout_type === "AGENCY" ? "Agency" : "Individual"} />
            <InfoRow label="Agency" value={scout.agency_name} />
            <InfoRow label="Country" value={scout.country} />
            <InfoRow label="City" value={scout.city} />
          </Accordion>
          {scout.show_contact && (
            <Accordion title="Contact">
              <InfoRow label="Phone" value={scout.contact_number} />
              <InfoRow label="Email" value={scout.email} />
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}