"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Info, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Label from "@/components/form/Label";
import Input from "@/components/form/InputField";
import Button from "@/components/elements/Button";
import CustomSelect from "@/components/CustomSelect";
import ThemedDatePicker from "@/components/ThemedDatePicker";
import ThemedAlert from "@/components/ThemedAlert";

const FORMATS = ['5-a-side', '7-a-side', '9-a-side', '11-a-side'];
const FORMAT_OPTIONS = FORMATS.map((f) => ({ value: f, label: f }));

const NO_SPINNER_STYLE = `
  input[type="number"].no-spinner::-webkit-inner-spin-button,
  input[type="number"].no-spinner::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"].no-spinner {
    -moz-appearance: textfield;
  }
`;

export default function CreateTournamentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const [form, setForm] = useState({
    tournament_name: "",
    tournament_type: "5-a-side",
    location: "",
    description: "",
    organization_name: "",
    representative_name: "",
    organization_phone: "",
    organization_email: "",
    representative_phone: "",
    representative_email: "",
    required_teams: 8,
    min_players_per_team: 5,
    max_players_per_team: 8,
    team_entry_fee: "",   // ← blank by default
    fee_currency: "KES",
    start_date: "",
    end_date: "",
    registration_deadline: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        setUser(me);
        setForm((prev) => ({
          ...prev,
          organization_email: prev.organization_email || me.email,
          representative_email: prev.representative_email || me.email,
        }));
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (e) => {
    setField(e.target.id, e.target.value);
  };

  const teamFee = parseFloat(form.team_entry_fee) || 0;
  const required = parseInt(form.required_teams) || 0;
  const commissionPct = 5;
  const platformFeePerTeam = Math.round(teamFee * (commissionPct / 100) * 100) / 100;
  const perTeamTotal = teamFee + platformFeePerTeam;
  const totalToOrganizer = teamFee * required;
  const totalFromTeams = perTeamTotal * required;
  const platformRevenue = platformFeePerTeam * required;

  const minStartDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required_fields = [
      'tournament_name', 'location', 'organization_name',
      'representative_name', 'start_date',
    ];
    const missing = required_fields.filter((f) => !form[f]);
    if (missing.length) {
      setAlert({
        title: "Missing fields",
        body: `Please fill: ${missing.join(', ')}`,
        variant: "warning",
      });
      return;
    }

    if (!form.team_entry_fee || parseFloat(form.team_entry_fee) < 0) {
      setAlert({
        title: "Entry fee required",
        body: "Please enter the team entry fee (0 for free tournaments).",
        variant: "warning",
      });
      return;
    }

    if (form.start_date < minStartDate) {
      setAlert({
        title: "Start date too soon",
        body: "Tournaments must start at least 7 days from today. This gives teams time to register and gives the platform time to disburse funds properly.",
        variant: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createTournament({
        ...form,
        required_teams: parseInt(form.required_teams),
        min_players_per_team: parseInt(form.min_players_per_team),
        max_players_per_team: parseInt(form.max_players_per_team),
        team_entry_fee: parseFloat(form.team_entry_fee),
        start_date: form.start_date,
        end_date: form.end_date || null,
        registration_deadline: form.registration_deadline || null,
      });

      setAlert({
        title: "Tournament created",
        body: "Your draft is ready. Review it, then publish when ready.",
        variant: "success",
        onConfirm: () => router.push(`/dashboard/organizer/${created.id}`),
      });
    } catch (err) {
      setAlert({
        title: "Could not create tournament",
        body: err.message || "Please try again.",
        variant: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <style>{NO_SPINNER_STYLE}</style>
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        <Link
          href="/dashboard/organizer"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to my tournaments
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Create a tournament</h1>
        <p className="text-white/60 mb-6">
          Set the rules, fees, and team requirements. You'll publish it after saving.
        </p>

        <div className="mb-6 rounded-xl border border-[#D4AF6A]/30 bg-[#D4AF6A]/5 p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#D4AF6A] mt-0.5 shrink-0" />
            <div>
              <p className="text-white font-medium text-sm">
                Plan at least 1 week ahead
              </p>
              <p className="text-white/60 text-xs mt-1 leading-relaxed">
                Tournaments must start at least <strong className="text-white">7 days from today</strong>.
                This gives teams time to register and complete payments, and gives
                Footy Scouts ample time to disburse the tournament funds to you
                before the event.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="rounded-2xl border border-white/10 bg-[#242030] p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Tournament details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tournament_name">
                  Tournament name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tournament_name"
                  value={form.tournament_name}
                  onChange={(e) => setField('tournament_name', e.target.value)}
                  placeholder="e.g. Nairobi 5-a-Side Cup 2026"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tournament_type">Format</Label>
                  <CustomSelect
                    value={form.tournament_type}
                    onChange={(v) => setField('tournament_type', v)}
                    options={FORMAT_OPTIONS}
                    placeholder="Select format"
                  />
                </div>
                <div>
                  <Label htmlFor="location">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setField('location', e.target.value)}
                    placeholder="e.g. Juja, Nairobi"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={3}
                  placeholder="Rules, prizes, format details..."
                  className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF6A]/60"
                />
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div className="rounded-2xl border border-white/10 bg-[#242030] p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Organizer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organization_name">
                  Organization <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="organization_name"
                  value={form.organization_name}
                  onChange={(e) => setField('organization_name', e.target.value)}
                  placeholder="e.g. Nairobi United FC"
                />
              </div>
              <div>
                <Label htmlFor="representative_name">
                  Representative <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="representative_name"
                  value={form.representative_name}
                  onChange={(e) => setField('representative_name', e.target.value)}
                  placeholder="e.g. John Kamau"
                />
              </div>
              <div>
                <Label htmlFor="organization_phone">Phone</Label>
                <Input
                  id="organization_phone"
                  value={form.organization_phone}
                  onChange={(e) => setField('organization_phone', e.target.value)}
                  placeholder="+254 700 000 000"
                />
              </div>
              <div>
                <Label htmlFor="organization_email">Email</Label>
                <Input
                  id="organization_email"
                  type="email"
                  value={form.organization_email}
                  onChange={(e) => setField('organization_email', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Team requirements */}
          <div className="rounded-2xl border border-white/10 bg-[#242030] p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Team requirements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="required_teams">Required teams</Label>
                <input
                  id="required_teams"
                  type="number"
                  min="2"
                  max="128"
                  className="no-spinner h-12 w-full rounded-md border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-[#D4AF6A]/60"
                  value={form.required_teams}
                  onChange={(e) => setField('required_teams', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="min_players_per_team">Min players / team</Label>
                <input
                  id="min_players_per_team"
                  type="number"
                  min="1"
                  className="no-spinner h-12 w-full rounded-md border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-[#D4AF6A]/60"
                  value={form.min_players_per_team}
                  onChange={(e) => setField('min_players_per_team', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max_players_per_team">Max players / team</Label>
                <input
                  id="max_players_per_team"
                  type="number"
                  min="1"
                  className="no-spinner h-12 w-full rounded-md border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-[#D4AF6A]/60"
                  value={form.max_players_per_team}
                  onChange={(e) => setField('max_players_per_team', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Fees */}
          <div className="rounded-2xl border border-[#D4AF6A]/30 bg-[#242030] p-6">
            <h2 className="text-white font-semibold text-lg mb-1">Entry fee</h2>
            <p className="text-white/50 text-xs mb-4">
              A platform fee of {commissionPct}% is added on top — you receive exactly what you set.
            </p>
            <div>
              <Label htmlFor="team_entry_fee">
                Team entry fee ({form.fee_currency}) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="team_entry_fee"
                type="number"
                min="0"
                step="50"
                placeholder="e.g. 5000"
                value={form.team_entry_fee}
                onChange={(e) => setField('team_entry_fee', e.target.value)}
              />
            </div>

            {form.team_entry_fee !== "" && teamFee >= 0 && (
              <div className="mt-4 rounded-lg bg-[#1C1928] border border-white/10 p-4 text-sm space-y-1.5 font-mono">
                <div className="flex justify-between text-white/70">
                  <span>Per-team fee</span>
                  <span>{form.fee_currency} {teamFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Platform fee ({commissionPct}%)</span>
                  <span>{form.fee_currency} {platformFeePerTeam.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#D4AF6A] font-semibold border-t border-white/10 pt-1.5">
                  <span>Team pays</span>
                  <span>{form.fee_currency} {perTeamTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/70 border-t border-white/10 pt-1.5">
                  <span>× {required} teams</span>
                  <span></span>
                </div>
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>You receive</span>
                  <span>{form.fee_currency} {totalToOrganizer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/50 text-xs">
                  <span>Total collected from teams</span>
                  <span>{form.fee_currency} {totalFromTeams.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/50 text-xs">
                  <span>Platform earns</span>
                  <span>{form.fee_currency} {platformRevenue.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="rounded-2xl border border-white/10 bg-[#242030] p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Dates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_date">
                  Start date <span className="text-red-500">*</span>
                </Label>
                <ThemedDatePicker
                  id="start_date"
                  value={form.start_date}
                  onChange={handleDateChange}
                  placeholder="Start date"
                  minDate={minStartDate}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End date</Label>
                <ThemedDatePicker
                  id="end_date"
                  value={form.end_date}
                  onChange={handleDateChange}
                  placeholder="End date"
                  minDate={form.start_date || minStartDate}
                />
              </div>
              <div>
                <Label htmlFor="registration_deadline">Registration deadline</Label>
                <ThemedDatePicker
                  id="registration_deadline"
                  value={form.registration_deadline}
                  onChange={handleDateChange}
                  placeholder="Deadline"
                  minDate={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="gold" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              ) : (
                "Create draft"
              )}
            </Button>
            <Link
              href="/dashboard/organizer"
              className="rounded-md border border-white/20 text-white px-5 py-3 text-sm hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
      <Footer />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}