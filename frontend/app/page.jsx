'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';  // ✅ Only import api, no types
import FAQ from "@/components/FAQ";
import PlayerCard from "@/components/PlayerCard";
import PlayerSearchBar from "@/components/PlayerSearch";
import TournamentCard from "@/components/TournamentCard";
import ScoutCard from "@/components/ScoutCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const [featuredPlayers, setFeaturedPlayers] = useState([]);  // ✅ No type annotation
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
      <section className="container mx-auto px-4 py-20 sm:py-24 pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <span className="gold-font mb-4 inline-block text-sm font-semibold uppercase tracking-[0.2em]">
            Football Recruitment, Reimagined
          </span>
          <h1 className="mb-6 text-3xl font-bold leading-snug text-white sm:text-4xl sm:leading-snug lg:text-5xl lg:leading-[1.2]">
            Footy Scouts — A football recruitment network
          </h1>
          <p className="gold-font mx-auto mb-6 max-w-2xl text-base font-medium sm:text-lg sm:leading-[1.44]">
            A platform designed, and built for aspiring and qualified football professionals.
          </p>
          <p className="mx-auto mb-9 max-w-2xl text-base font-medium text-white/80 sm:text-lg sm:leading-[1.44]">
            Register, create your profile, and get discovered by scouts, agents, and clubs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-md border border-white/20 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white hover:text-black"
            >
              Find out more →
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-white px-7 py-3.5 text-base font-medium text-black transition hover:bg-gray-200"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      {/* Players Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="gold-font mb-3 inline-block text-sm font-semibold uppercase tracking-[0.2em]">
              Discover Talent
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Find a player</h2>
            <div className="mt-6 flex justify-center">
              <PlayerSearchBar />
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#242030] rounded-lg p-5 border border-white/10 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : featuredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          ) : (
            <p className="text-center text-white/40">No players found</p>
          )}
          <div className="mt-8 text-center">
            <Link href="/players" className="text-[#D4AF6A] hover:underline">
              View all players →
            </Link>
          </div>
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="bg-[#1C1928] py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="gold-font mb-3 inline-block text-sm font-semibold uppercase tracking-[0.2em]">
                  Compete
                </span>
                <h2 className="text-3xl font-bold text-white sm:text-4xl">Upcoming tournaments</h2>
              </div>
              <Link
                href="/tournaments"
                className="shrink-0 rounded-md border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-black"
              >
                See all tournaments →
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#242030] rounded-lg p-5 border border-white/10 animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                    <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : recentTournaments.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {recentTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <p className="text-center text-white/40">No tournaments available</p>
            )}
          </div>
        </div>
      </section>

      {/* Scouts Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="gold-font mb-3 inline-block text-sm font-semibold uppercase tracking-[0.2em]">
              Trusted Network
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">See some of our scouts</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#242030] rounded-lg p-5 border border-white/10 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : verifiedScouts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {verifiedScouts.map((scout) => (
                <ScoutCard key={scout.id} scout={scout} />
              ))}
            </div>
          ) : (
            <p className="text-center text-white/40">No scouts found</p>
          )}
          <div className="mt-8 text-center">
            <Link href="/scouts" className="text-[#D4AF6A] hover:underline">
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