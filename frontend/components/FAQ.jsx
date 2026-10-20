"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What is Footy Scouts?",
    a: "Footy Scouts is a football recruitment network connecting players, scouts, and clubs. Players create profiles to get discovered, scouts search for talent, and clubs and institutions list opportunities. We also host tournaments where teams compete for prizes.",
  },
  {
    q: "How do I create a player profile?",
    a: "Sign up for a free account, then complete the onboarding flow to add your name, position, nationality, and date of birth. You can add a profile picture, biography, and highlights later from your dashboard.",
  },
  {
    q: "Is Footy Scouts free?",
    a: "Yes — you can create a profile, upload images and PDFs, browse players and scouts, and participate in tournaments for free. Premium subscriptions (KSh 1,000/month or KSh 10,000/year) unlock extra features like contacting scouts directly and uploading video highlights.",
  },
  {
    q: "What does Premium include?",
    a: "Premium members can contact scouts and institutions directly, upload video highlights to their profile, get featured on the homepage, and see detailed profile analytics. Payment is via Paystack — cards, mobile money, and bank transfers accepted.",
  },
  {
    q: "How do I join a team?",
    a: "Visit the Teams page from your dashboard. You can browse available teams and request to join, or accept an invitation if a captain has invited you. Captains must approve your request before you're added to the squad.",
  },
  {
    q: "How do tournaments work?",
    a: "Organizers create tournaments with a required number of teams, a minimum and maximum squad size, and a total tournament fee. That fee is split equally among the teams — so if a tournament needs 8 teams and the total fee is KSh 40,000, each team pays KSh 5,000 (plus a small platform fee). Captains pay once their squad reaches the minimum player count. When all teams have paid, the tournament is confirmed and the organizer receives their payout.",
  },
  {
    q: "Why must captains be players?",
    a: "Every team captain must have an active player profile on Footy Scouts. This ensures captains are genuinely invested in the platform and understand the player experience. If you don't have a player profile yet, complete the player onboarding first — it only takes a minute.",
  },
  {
    q: "Can I be part of multiple teams?",
    a: "Yes — you can join multiple teams and play in multiple tournaments. However, you cannot belong to two different teams in the same tournament. This rule keeps tournaments fair and prevents conflicts.",
  },
  {
    q: "Who can contact scouts?",
    a: "Only Premium members can contact scouts and institutions directly via Call or WhatsApp. Free members can still view scout profiles but must upgrade to initiate contact.",
  },
  {
    q: "How do I get verified?",
    a: "Scout and institution accounts are reviewed by our admin team after signup. Once approved, a verified badge appears on your profile and you can contact players and manage tournaments. Player accounts are auto-approved.",
  },
  {
    q: "How are payments handled?",
    a: "All payments run through Paystack — secure, card and mobile money friendly, and PCI-compliant. Team entry fees and premium subscriptions are processed instantly. Tournament organizers receive their payouts via bank transfer or M-Pesa within 3-5 business days after registration closes.",
  },
  {
    q: "How do I delete my account?",
    a: "You can delete your account from your dashboard. Your profile and personal data will be permanently removed. Payment records are retained for legal and accounting purposes as per our Privacy Policy.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="container mx-auto px-4 py-12 md:py-20 border-t border-white/5">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 md:mb-12 text-center">
          <span className="text-[#D4AF6A] mb-2 md:mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            Frequently Asked
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
            Questions & answers
          </h2>
          <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
            Everything you need to know about Footy Scouts.
          </p>
        </div>

        <div className="space-y-2">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-lg border border-white/10 bg-[#242030] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-left hover:bg-[#1C1928]/50 transition"
                  aria-expanded={isOpen}
                >
                  <span className="text-white font-medium text-sm md:text-base">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 md:w-5 md:h-5 text-[#D4AF6A] shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 md:px-5 pb-4 md:pb-5 -mt-1">
                    <p className="text-white/60 text-sm leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 md:mt-12 text-center">
          <p className="text-white/60 text-sm mb-3">
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
          >
            Contact us →
          </a>
        </div>
      </div>
    </section>
  );
}