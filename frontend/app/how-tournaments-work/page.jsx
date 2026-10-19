import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Trophy, Users, CreditCard, ShieldCheck, HandCoins, CheckCircle2,
  AlertCircle, ArrowRight, UserCheck, MessageSquare, Clock,
} from "lucide-react";

export const metadata = {
  title: "Footy Scouts | How Tournaments Work",
  description:
    "Complete guide to running and joining tournaments on Footy Scouts — teams, captains, players, payments, and payouts.",
};

export default function HowTournamentsWorkPage() {
  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 sm:pt-32 md:pt-36 pb-20 max-w-4xl">

        {/* Hero */}
        <div className="text-center mb-12">
          <span className="text-[#D4AF6A] mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            How Tournaments Work
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Run a tournament. <br className="hidden sm:block" />
            Join a team. <span className="text-[#D4AF6A]">Get paid.</span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-sm md:text-base">
            Footy Scouts uses a simple team-based system. Captains pay, organizers
            get paid, players play. Here's the entire flow — no surprises.
          </p>
        </div>

        {/* The Three Roles */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
            The three roles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RoleCard
              icon={Trophy}
              title="Tournament Organizer"
              body="Creates the tournament, sets the fee, invites teams, and receives payment when registration closes."
            />
            <RoleCard
              icon={Users}
              title="Team Captain"
              body="Creates a team, invites players, and pays the team entry fee once the squad is ready."
            />
            <RoleCard
              icon={UserCheck}
              title="Player"
              body="Joins a team, gets invited or requests to join, and is part of the squad that competes."
            />
          </div>
        </section>

        {/* Important rule */}
        <div className="mb-12 rounded-xl border border-[#D4AF6A]/40 bg-[#D4AF6A]/10 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-[#D4AF6A] mt-0.5 shrink-0" />
            <div>
              <h3 className="text-white font-semibold mb-1">Important: Captains must be players</h3>
              <p className="text-white/70 text-sm">
                To create a team and become a captain, you must first have a player
                profile on Footy Scouts. This ensures every captain is an active
                participant in the game.
              </p>
            </div>
          </div>
        </div>

        {/* The flow */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
            The complete flow
          </h2>
          <div className="space-y-4">
            <Step
              number="1"
              title="Organizer creates the tournament"
              body={
                <>
                  Sets the name, format (5/7/9/11-a-side), location, dates,
                  <strong> required number of teams</strong>, and{" "}
                  <strong>total tournament fee</strong> (e.g. KSh 40,000).
                  The system automatically calculates the per-team entry fee by
                  dividing the total by the required teams.
                </>
              }
            />
            <Step
              number="2"
              title="Organizer publishes the tournament"
              body="Once published, teams can see it and request to join — or the organizer can invite existing teams directly."
            />
            <Step
              number="3"
              title="Teams accept invitations or get approved"
              body="Organizer invites a team → captain accepts. Or a team requests to join → organizer approves. Once accepted, the captain can build the squad."
            />
            <Step
              number="4"
              title="Captain builds the squad"
              body="Captain invites players or approves player requests until the team reaches the minimum number of players required by the tournament."
            />
            <Step
              number="5"
              title="Captain pays the team entry fee"
              body="Once the minimum squad is reached, the payment button unlocks. The captain pays the full team fee, which includes a small platform fee on top of the tournament fee. The team is now officially registered."
            />
            <Step
              number="6"
              title="Repeat until all required teams are registered"
              body="Tournament fills up one team at a time. Payment is required to lock a spot."
            />
            <Step
              number="7"
              title="Organizer closes registration"
              body="When all required teams are paid, the organizer clicks 'Close registration'. A unique payout code is generated for them."
            />
            <Step
              number="8"
              title="Organizer receives payment"
              body="The organizer contacts Footy Scouts admin with their payout code. Admin transfers the net amount via bank transfer or M-Pesa."
            />
          </div>
        </section>

        {/* Payment model */}
        <section className="mb-12 rounded-2xl border border-white/10 bg-[#242030] p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#D4AF6A]" />
            Payment model
          </h2>
          <p className="text-white/70 text-sm mb-6">
            We use a transparent per-team fee structure. Here's exactly what happens with every payment:
          </p>

          <div className="rounded-lg bg-[#1C1928] p-5 mb-6 font-mono text-xs md:text-sm text-white/80 overflow-x-auto">
            <div className="whitespace-nowrap">
              Total tournament fee (organizer enters)   KSh 40,000.00
            </div>
            <div className="whitespace-nowrap">
              Required teams                            ÷ 8
            </div>
            <div className="whitespace-nowrap border-t border-white/10 mt-1 pt-1">
              Per-team tournament fee (auto)            KSh  5,000.00
            </div>
            <div className="whitespace-nowrap">
              Platform fee (5%, added on top)           KSh    250.00
            </div>
            <div className="whitespace-nowrap border-t border-white/10 mt-1 pt-1 text-[#D4AF6A]">
              Each team pays                           KSh  5,250.00
            </div>
            <div className="whitespace-nowrap mt-2">
              Footy Scouts receives (8 × 250)           KSh  2,000.00
            </div>
            <div className="whitespace-nowrap text-green-400">
              Organizer receives (8 × 5,000)            KSh 40,000.00
            </div>
          </div>

          <div className="space-y-2 text-sm text-white/70">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF6A] mt-0.5 shrink-0" />
              Teams pay the full amount upfront — no hidden charges later.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF6A] mt-0.5 shrink-0" />
              Organizers receive the exact tournament fee they set — the platform
              fee is added <em>on top</em>, not deducted from it.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF6A] mt-0.5 shrink-0" />
              Captains can collect the fee from players however they choose —
              split it, pay from their own pocket, or any arrangement they prefer.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF6A] mt-0.5 shrink-0" />
              All team payments are processed securely via Paystack (cards,
              mobile money, bank transfers).
            </p>
          </div>
        </section>

        {/* Payout section */}
        <section className="mb-12 rounded-2xl border border-green-500/30 bg-green-500/5 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-green-400" />
            How payouts work
          </h2>
          <div className="space-y-3 text-sm text-white/70">
            <p>
              When all teams have paid and the organizer closes registration, a
              unique <strong className="text-white">payout code</strong> is generated.
            </p>
            <div className="rounded-md bg-[#1C1928] p-3 font-mono text-xs text-[#D4AF6A] my-3">
              PAYOUT-ABC12345
            </div>
            <p>
              The organizer contacts Footy Scouts admin with this code. Admin
              verifies the tournament and transfers the net amount via bank
              transfer or M-Pesa.
            </p>
            <p>
              Payouts are processed within <strong className="text-white">3–5 business days</strong>{" "}
              of the tournament being confirmed.
            </p>
          </div>
        </section>

        {/* Cancellation */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D4AF6A]" />
            What if a tournament doesn't fill?
          </h2>
          <div className="space-y-3 text-sm text-white/70">
            <p>
              If not all required teams register before the deadline, the organizer
              can:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-white">Extend the deadline</strong> to give more teams a chance to join.</li>
              <li><strong className="text-white">Cancel the tournament</strong> — every team that paid will be refunded in full via Paystack.</li>
            </ul>
            <p className="text-white/50 text-xs italic mt-2">
              Refunds include both the tournament fee and the platform fee. Footy
              Scouts does not keep any commission on cancelled tournaments.
            </p>
          </div>
        </section>

        {/* Rules summary */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D4AF6A]" />
            Rules in one glance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Rule text="A team cannot be in two tournaments with the same name conflict" />
            <Rule text="A player cannot be on two teams in the same tournament" />
            <Rule text="Squads can't be edited after payment without organizer approval" />
            <Rule text="Captains must be players" />
            <Rule text="Minimum players required before payment unlocks" />
            <Rule text="Maximum squad size is enforced on the backend" />
            <Rule text="All payments are verified server-side via Paystack" />
            <Rule text="Webhooks are idempotent — safe to receive duplicates" />
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tournaments"
              className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-3 font-medium hover:bg-[#c9a45f] transition"
            >
              Browse tournaments <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-6 py-3 font-medium hover:bg-[#D4AF6A]/10 transition"
            >
              <MessageSquare className="w-4 h-4" />
              Contact admin
            </Link>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}

function RoleCard({ icon: Icon, title, body }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#242030] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF6A]/15">
        <Icon className="w-5 h-5 text-[#D4AF6A]" />
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{body}</p>
    </div>
  );
}

function Step({ number, title, body }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF6A] text-[#1C1928] font-bold text-sm">
        {number}
      </div>
      <div className="flex-1 pb-4">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function Rule({ text }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-[#242030] p-3">
      <CheckCircle2 className="w-4 h-4 text-[#D4AF6A] mt-0.5 shrink-0" />
      <span className="text-white/70">{text}</span>
    </div>
  );
}