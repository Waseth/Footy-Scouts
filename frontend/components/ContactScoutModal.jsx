"use client";

import Link from "next/link";
import { X, Lock, MessageCircle, Phone } from "lucide-react";

export default function ContactScoutModal({ open, onClose, scoutName, reason }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#242030] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-full bg-[#D4AF6A]/15 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#D4AF6A]" />
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-white text-xl font-bold mb-2">
          Premium required
        </h2>
        <p className="text-white/70 text-sm mb-5">
          Contacting{" "}
          {scoutName ? (
            <span className="text-white font-medium">{scoutName}</span>
          ) : (
            "this profile"
          )}{" "}
          requires a premium player account. Upgrade to unlock direct calls and
          WhatsApp messaging.
        </p>

        <div className="rounded-lg bg-[#1C1928] border border-white/10 p-4 mb-5 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-white/80">
            <Phone className="w-4 h-4 text-[#D4AF6A]" />
            Direct call button
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <MessageCircle className="w-4 h-4 text-[#D4AF6A]" />
            WhatsApp messaging
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-white/20 text-white px-4 py-2.5 text-sm hover:bg-white/5 transition"
          >
            Not now
          </button>
          <Link
            href={`/pricing?reason=${reason || "contact_scout"}`}
            className="flex-1 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2.5 text-sm font-medium text-center hover:bg-[#D4AF6A]/90 transition"
          >
            See plans
          </Link>
        </div>
      </div>
    </div>
  );
}