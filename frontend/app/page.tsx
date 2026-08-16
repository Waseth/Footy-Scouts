'use client';

import FAQ from "@/components/FAQ";
import PlayerCard from "@/components/PlayerCard";
import PlayerSearchBar from "@/components/PlayerSearch";
import { dummyPlayers, dummyScouts } from "@/lib/DummyData";
import Link from "next/link";
import { dummyTournaments } from "@/lib/DummyData";
import TournamentCard from "@/components/TournamentCard";
import ScoutCard from "@/components/ScoutCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1C1928]">
      {/* Hero */}
      <section className="container overflow-hidden mt-8 py-20 sm:py-24">
        <div
          className="hero-content wow fadeInUp mx-auto max-w-195 text-center"
          data-wow-delay=".2s"
          style={{ visibility: "visible", animationDelay: "0.2s" }}
        >
          <span className="gold-font mb-4 inline-block text-sm font-semibold uppercase tracking-[0.2em]">
            Football Recruitment, Reimagined
          </span>

          <h1
            className="mb-6 text-3xl font-bold leading-snug text-white sm:text-4xl sm:leading-snug lg:text-5xl lg:leading-[1.2]"
            tabIndex={-1}
          >
            Footy Scouts — A football recruitment network
          </h1>

          <p className="gold-font mx-auto mb-6 max-w-211.25 text-base font-medium sm:text-lg sm:leading-[1.44]">
            A platform designed, and built for aspiring and qualified football professionals.
          </p>

          <p className="mx-auto mb-9 max-w-211.25 text-base font-medium text-white/80 sm:text-lg sm:leading-[1.44]">
            Register, create your profile, and get discovered by scouts, agents, and clubs. From grassroots to the professionals — players, staff, coaches, scouts, agents, clubs and analysts — a football recruitment network for everyone.
          </p>

          <ul className="mb-4 flex flex-wrap items-center justify-center gap-5">
            <li><a

              href="/about"
              className="flex items-center gap-4 rounded-md bg-[#1C192F] px-6 py-3.5 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-white hover:text-black"
            >
              <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </g>
              </svg>
              Find out more
            </a>
            </li>

            <li>
              <a

                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-md bg-white px-7 py-3.5 text-center text-base font-medium text-black shadow-1 transition duration-300 ease-in-out hover:bg-gray-2 hover:text-body-color"
              >
                Register Now
              </a>
            </li>
          </ul>
        </div>
      </section>



      {/* Section 2 — placeholder */}
      <section className="flex min-h-screen items-center justify-center bg-[#1C1928]">
        <div className="mx-auto w-full max-w-6xl text-center">
          <span className="gold-font mb-3 inline-block text-sm font-semibold uppercase tracking-[0.2em]">
            Discover Talent
          </span>
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">Find a player</h2>
          <div className="mb-12 flex justify-center">
            <PlayerSearchBar />
          </div>
          <div className="grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
            {dummyPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — placeholder, alternate shade */}
      <section className="flex min-h-screen items-center text-black justify-center bg-[#fbfbfb]">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="gold-font mb-3 inline-block text-sm font-semibold uppercase tracking-[0.2em]">
                Compete
              </span>
              <h2 className="text-3xl font-bold text-black sm:text-4xl">Upcoming tournaments</h2>
            </div>
            <Link
              href="/blog"
              className="shrink-0 rounded-md bg-white/12 px-6 py-3 text-sm font-medium transition duration-300 ease-in-out hover:bg-black hover:text-white"
            >
              See past tournaments →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dummyTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — placeholder */}
      <section className="flex min-h-screen items-center justify-center bg-[#1C1928]">
        <div className="mx-auto w-full max-w-6xl text-center">
          <span className="gold-font mb-3 inline-block text-sm font-semibold uppercase tracking-[0.2em]">
            Trusted Network
          </span>
          <h2 className="mb-12 text-3xl font-bold text-white sm:text-4xl">See some of our scouts</h2>
          <div className="grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
            {dummyScouts.map((scout) => (
              <ScoutCard key={scout.id} scout={scout} />
            ))}
          </div>
        </div>
      </section>

      <FAQ />
    </div>
  );
}