"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, MessageCircle, Video, Eye, Check, Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";

export default function SubscribePage() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (!api.isAuthenticated()) {
        setRole("GUEST");
        setChecking(false);
        return;
      }
      try {
        const me = await api.getMe();
        setRole(me?.role || "PLAYER");
      } catch {
        setRole("GUEST");
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  if (role === "SCOUT" || role === "INSTITUTION") {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="rounded-2xl border border-[#D4AF6A]/30 bg-[#242030] p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-3">
              No subscription needed
            </h1>
            <p className="text-white/60 mb-6">
              {role === "SCOUT"
                ? "Your scout account has full free access — contact players, shortlist talent, organize tournaments."
                : "Your institution account has full free access — contact players and scouts, shortlist talent, organize tournaments."}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-3 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (role === "ADMIN") {
    router.replace("/admin");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <section className="container mx-auto px-4 pt-28 sm:pt-32 md:pt-36 pb-16">
        <div className="mx-auto max-w-3xl text-center px-4">
          <span className="text-[#D4AF6A] mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            Subscribe
          </span>
          <h1 className="mb-5 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Unlock <span className="text-[#D4AF6A]">Footy Scouts</span> Premium
          </h1>
          <p className="text-white/60 mx-auto max-w-2xl text-sm sm:text-base md:text-lg mb-8">
            Free accounts can browse. Premium members can be discovered,
            reach out, and get ahead.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] px-6 py-3 text-sm font-medium text-[#1C1928] hover:bg-[#c9a45f] transition"
          >
            <Star className="w-4 h-4" /> See plans
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { icon: MessageCircle, title: "Contact scouts & clubs", body: "Reach out directly to verified scouts and clubs looking for talent." },
            { icon: Video, title: "Upload video highlights", body: "Show your skills with match clips. Free accounts can't upload video." },
            { icon: Star, title: "Featured placement", body: "Appear on the homepage and top of search results." },
            { icon: Eye, title: "Profile analytics", body: "See who's viewing your profile and where interest is coming from." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-white/10 bg-[#242030] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF6A]/15">
                <f.icon className="w-6 h-6 text-[#D4AF6A]" />
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 bg-[#242030]/30">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              Free vs Premium
            </h2>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="rounded-xl border border-white/10 bg-[#1C1928] p-6">
                <h3 className="text-white font-semibold text-lg mb-4">Free</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-white/40 mt-0.5" /> Create profile</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-white/40 mt-0.5" /> Upload images &amp; PDF</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-white/40 mt-0.5" /> Browse players, scouts, tournaments</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#D4AF6A] bg-[#D4AF6A]/10 p-6">
                <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#D4AF6A]" /> Premium
                </h3>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-[#D4AF6A] mt-0.5" /> Everything in Free</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-[#D4AF6A] mt-0.5" /> Contact scouts &amp; clubs</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-[#D4AF6A] mt-0.5" /> Upload video highlights</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-[#D4AF6A] mt-0.5" /> Featured placement</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-[#D4AF6A] mt-0.5" /> Profile analytics</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] px-6 py-3 text-sm font-medium text-[#1C1928] hover:bg-[#c9a45f] transition"
              >
                Go premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}