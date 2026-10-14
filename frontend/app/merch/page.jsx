"use client";

import { useState } from "react";
import {
  ShoppingBag, Mail, CheckCircle2, Sparkles, Bell,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MerchPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyOnList, setAlreadyOnList] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.request("/waitlist", {
        method: "POST",
        body: JSON.stringify({ email, source: "merch" }),
      });
      const already = res?.data?.already_on_list === true;
      setAlreadyOnList(already);
      setSubmitted(true);
      setEmail("");
      setTimeout(() => {
        setSubmitted(false);
        setAlreadyOnList(false);
      }, 6000);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      {/* ═══════════ HERO ═══════════ */}
      <section className="container mx-auto px-4 pt-28 sm:pt-32 md:pt-40 pb-16">
        <div className="mx-auto max-w-3xl text-center px-4">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF6A]/15">
            <ShoppingBag className="w-10 h-10 text-[#D4AF6A]" />
          </div>

          <span className="text-[#D4AF6A] mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            Footy Scouts Merch
          </span>
          <h1 className="mb-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
            The <span className="text-[#D4AF6A]">Official Store</span> is
            <br className="hidden sm:block" /> launching soon
          </h1>
          <p className="text-white/60 mx-auto mb-10 max-w-xl text-sm sm:text-base md:text-lg">
            Premium gear for players, scouts, and the Footy Scouts community.
            Join the waitlist and be first to shop when we drop.
          </p>

          <div className="mx-auto max-w-md">
            {submitted ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                {alreadyOnList
                  ? "You're already on the list — we'll be in touch."
                  : "You're on the list. Watch your inbox for the drop."}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="flex-1 rounded-md border border-white/15 bg-[#242030] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#D4AF6A]/60 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-[#D4AF6A] px-6 py-3 text-sm font-medium text-[#1C1928] transition hover:bg-[#c9a45f] whitespace-nowrap disabled:opacity-50"
                >
                  {loading ? "Adding…" : "Notify me"}
                </button>
              </form>
            )}
            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}
            <p className="mt-4 text-xs text-white/40">
              No spam. Just one email when we launch.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ WHAT'S COMING ═══════════ */}
      <section className="border-t border-white/5 bg-[#242030]/40">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 md:mb-14 text-center">
              <span className="text-[#D4AF6A] mb-2 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
                What&apos;s coming
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                A preview of the collection
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
              <PreviewCard
                title="Matchday Apparel"
                body="Jerseys, hoodies, and training tees in the signature black and gold."
                icon={ShoppingBag}
              />
              <PreviewCard
                title="Training Essentials"
                body="Bibs, cones, ball carriers — everything a squad needs."
                icon={Sparkles}
              />
              <PreviewCard
                title="Scout Gear"
                body="Notebooks, caps, and accessories for the people behind the scenes."
                icon={Bell}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ WHY WAITLIST ═══════════ */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Why join the waitlist?
          </h2>
          <p className="text-white/60 mb-8">
            Waitlist members get priority access, exclusive launch discounts,
            and behind-the-scenes previews before the public.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <PerkCard number="01" title="Priority access" />
            <PerkCard number="02" title="Launch discount" />
            <PerkCard number="03" title="Early previews" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PreviewCard({ title, body, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1C1928] p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF6A]/15">
        <Icon className="w-6 h-6 text-[#D4AF6A]" />
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{body}</p>
    </div>
  );
}

function PerkCard({ number, title }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#242030] p-4">
      <p className="text-[#D4AF6A] font-bold text-lg mb-1">{number}</p>
      <p className="text-white text-sm font-medium">{title}</p>
    </div>
  );
}