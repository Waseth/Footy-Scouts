"use client";

import Link from "next/link";
import { Star, MessageCircle, Video, Eye, ArrowRight } from "lucide-react";

export default function PremiumCTA({ variant = "banner" }) {
  if (variant === "banner") {
    return (
      <div className="rounded-2xl border border-[#D4AF6A]/30 bg-gradient-to-r from-[#D4AF6A]/10 to-transparent p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#D4AF6A] p-2 text-[#1C1928] shrink-0">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                Unlock premium features
              </h3>
              <p className="text-white/60 text-sm mt-0.5">
                Contact scouts, upload highlights, and get discovered faster.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition shrink-0"
          >
            See plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // variant === "card"
  return (
    <div className="rounded-2xl border border-[#D4AF6A]/30 bg-[#242030] p-6">
      <h3 className="text-white font-semibold text-lg mb-2">
        Upgrade to Premium
      </h3>
      <p className="text-white/60 text-sm mb-4">
        Get the most out of Footy Scouts.
      </p>
      <ul className="space-y-2 mb-5">
        <li className="flex items-start gap-2 text-sm text-white/70">
          <MessageCircle className="w-4 h-4 text-[#D4AF6A] mt-0.5 shrink-0" />
          Contact scouts & institutions
        </li>
        <li className="flex items-start gap-2 text-sm text-white/70">
          <Video className="w-4 h-4 text-[#D4AF6A] mt-0.5 shrink-0" />
          Upload video highlights
        </li>
        <li className="flex items-start gap-2 text-sm text-white/70">
          <Eye className="w-4 h-4 text-[#D4AF6A] mt-0.5 shrink-0" />
          Full profile analytics
        </li>
      </ul>
      <Link
        href="/pricing"
        className="block rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-3 text-center font-medium hover:bg-[#D4AF6A]/90 transition"
      >
        View plans
      </Link>
      <p className="mt-3 text-center text-xs text-white/40">
        From KSh 1,000 / month
      </p>
    </div>
  );
}