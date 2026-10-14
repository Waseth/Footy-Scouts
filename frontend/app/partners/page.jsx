import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Handshake, Building2, Users, Trophy, ArrowRight, Mail } from "lucide-react";

export const metadata = {
  title: "Footy Scouts | Partners",
  description: "Partner with Footy Scouts — clubs, academies, tournaments, and sponsors.",
};

const PARTNER_TYPES = [
  {
    icon: Building2,
    title: "Clubs & Academies",
    body: "List your club, discover talent, and post open trials to our player base.",
  },
  {
    icon: Trophy,
    title: "Tournament Organizers",
    body: "Host tournaments through the platform — team registrations, payments, and rosters managed for you.",
  },
  {
    icon: Users,
    title: "Scouts & Agencies",
    body: "Get verified, build your shortlist, and reach players directly through premium tools.",
  },
  {
    icon: Handshake,
    title: "Brands & Sponsors",
    body: "Reach a focused audience of players, parents, and clubs across East Africa and beyond.",
  },
];

const WHY = [
  { title: "Trusted network", body: "Verified accounts and admin-reviewed profiles." },
  { title: "Kenya-built", body: "Rooted in Nairobi, built for grassroots football." },
  { title: "Growing fast", body: "Players, scouts, and clubs joining every week." },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <section className="container mx-auto px-4 pt-28 sm:pt-32 md:pt-36 pb-16">
        <div className="mx-auto max-w-3xl text-center px-4">
          <span className="text-[#D4AF6A] mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            Partners
          </span>
          <h1 className="mb-5 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Grow the game <span className="text-[#D4AF6A]">with us</span>
          </h1>
          <p className="text-white/60 mx-auto max-w-2xl text-sm sm:text-base md:text-lg">
            Footy Scouts connects players, scouts, clubs, and organizers.
            If you're building football in your community, we want to work with you.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          {PARTNER_TYPES.map((p) => (
            <div key={p.title} className="rounded-2xl border border-white/10 bg-[#242030] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF6A]/15">
                <p.icon className="w-6 h-6 text-[#D4AF6A]" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-white/60 text-sm">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 bg-[#242030]/30">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
              Why partner with Footy Scouts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {WHY.map((w) => (
                <div key={w.title} className="rounded-xl border border-white/10 bg-[#1C1928] p-6 text-center">
                  <h3 className="text-white font-semibold mb-2">{w.title}</h3>
                  <p className="text-white/60 text-sm">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#D4AF6A]/30 bg-gradient-to-br from-[#242030] to-[#1C1928] p-8 md:p-10 text-center">
          <Mail className="w-8 h-8 text-[#D4AF6A] mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            Let's talk
          </h2>
          <p className="text-white/60 text-sm md:text-base mb-6">
            Email us with a short note about your club, academy, tournament, or brand
            and we'll get back to you within a few days.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] px-6 py-3 text-sm font-medium text-[#1C1928] hover:bg-[#c9a45f] transition"
          >
            Contact us <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}