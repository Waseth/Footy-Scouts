'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import FAQ from "@/components/FAQ";
import PlayerCard from "@/components/PlayerCard";
import TournamentCard from "@/components/TournamentCard";
import ScoutCard from "@/components/ScoutCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const [featuredPlayers, setFeaturedPlayers] = useState([]);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [verifiedScouts, setVerifiedScouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, tournamentsRes, scoutsRes] = await Promise.all([
          api.getPlayers({ page: 1, per_page: 4 }),
          api.getTournaments({ page: 1, per_page: 3 }),
          api.getScouts({ page: 1, per_page: 3 }),
        ]);
        setFeaturedPlayers(playersRes.items || []);
        setRecentTournaments(tournamentsRes.items || []);
        setVerifiedScouts(scoutsRes.items || []);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20 md:py-24 pt-20 sm:pt-24 md:pt-32">
        <div className="mx-auto max-w-4xl text-center px-4">
          <span className="text-[#D4AF6A] mb-3 md:mb-4 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            Football Recruitment, Reimagined
          </span>
          <h1 className="mb-4 md:mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-snug ">
            Footy Scouts — A football recruitment network
          </h1>
          <p className="text-white/80 mx-auto mb-6 md:mb-9 max-w-2xl text-sm sm:text-base md:text-lg font-medium">
            Register, create your profile, and get discovered by scouts, agents, and clubs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-md bg-[#1C1928] border border-[#D4AF6A]/30 px-4 md:px-6 py-2.5 md:py-3.5 text-sm md:text-base font-medium text-[#D4AF6A] transition hover:bg-[#D4AF6A] hover:text-[#1C1928] cursor-pointer"
            >
              Find out more →
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-[#D4AF6A] px-5 md:px-7 py-2.5 md:py-3.5 text-sm md:text-base font-medium text-[#1C1928] transition cursor-pointer"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      {/* Players Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 md:mb-10 text-center">
            <span className="text-[#D4AF6A] mb-2 md:mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
              Discover Talent
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Find a player</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#242030] rounded-lg p-4 md:p-5 border border-white/10 animate-pulse">
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-3 md:h-4 bg-white/10 rounded w-3/4 mb-1 md:mb-2" />
                      <div className="h-2 md:h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-2 md:h-3 bg-white/10 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : featuredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {featuredPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          ) : (
            <p className="text-center">No players found</p>
          )}
          <div className="mt-6 md:mt-8 text-center">
            <Link
              href="/players"
              className="inline-block rounded-md border border-[#D4AF6A]/30 px-6 py-2.5 text-[#D4AF6A] hover:bg-[#D4AF6A] hover:text-[#1C1928] transition text-sm md:text-base cursor-pointer"
            >
              View all players →
            </Link>
          </div>
        </div>
      </section>

{/* Tournaments Section */}
<section className="bg-[#1C1928] py-12 md:py-16 border-t border-white/5">
  <div className="container mx-auto px-4">
    <div className="mx-auto max-w-6xl">
      {/* Centered Header */}
      <div className="mb-6 md:mb-10 text-center">
        <span className="text-[#D4AF6A] mb-1 md:mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
          Compete
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Upcoming tournaments</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#242030] rounded-lg p-4 md:p-5 border border-white/10 animate-pulse">
              <div className="h-3 md:h-4 bg-white/10 rounded w-1/3 mb-2 md:mb-3" />
              <div className="h-4 md:h-5 bg-white/10 rounded w-3/4 mb-1 md:mb-2" />
              <div className="h-3 md:h-4 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : recentTournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {recentTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-white">No tournaments available at the moment</p>
          <div className="mt-4">
            <Link
              href="/tournaments"
              className="inline-block rounded-md bg-[#1C1928] border border-[#D4AF6A]/30 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-[#D4AF6A] transition hover:bg-[#D4AF6A] hover:text-[#1C1928] cursor-pointer"
            >
              See all tournaments →
            </Link>
          </div>
        </div>
      )}
    </div>
  </div>
</section>

      {/* Scouts Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 md:mb-10 text-center">
            <span className="text-[#D4AF6A] mb-2 md:mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
              Trusted Network
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">See some of our scouts</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#242030] rounded-lg p-4 md:p-5 border border-white/10 animate-pulse">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-3 md:h-4 bg-white/10 rounded w-3/4 mb-1 md:mb-2" />
                      <div className="h-2 md:h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : verifiedScouts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {verifiedScouts.map((scout) => (
                <ScoutCard key={scout.id} scout={scout} />
              ))}
            </div>
          ) : (
            <p className="text-center text-white">No scouts found</p>
          )}
          <div className="mt-6 md:mt-8 text-center">
            <Link
              href="/scouts"
              className="inline-block rounded-md border border-[#D4AF6A]/30 px-6 py-2.5 text-[#D4AF6A] hover:bg-[#D4AF6A] hover:text-[#1C1928] transition text-sm md:text-base cursor-pointer"
            >
              View all scouts →
            </Link>
          </div>
        </div>
      </section>

      <FAQ />
      <Footer />
    </div>
  );
}