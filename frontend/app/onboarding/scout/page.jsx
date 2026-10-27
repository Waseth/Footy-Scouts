"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Globe, MapPin, Building2, Phone } from "lucide-react";
import Image from "next/image";

export default function ScoutOnboarding() {
  const [scoutType, setScoutType] = useState("INDIVIDUAL");
  const [formData, setFormData] = useState({
    scoutName: "",
    agencyName: "",
    country: "",
    city: "",
    phoneNumber: "",
  });
  const [progress, setProgress] = useState(50);
  const [animate, setAnimate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setError("");
  };

  const isFormValid =
    formData.scoutName &&
    formData.country &&
    formData.city &&
    formData.phoneNumber &&
    (scoutType === "INDIVIDUAL" || (scoutType === "AGENCY" && formData.agencyName));

  const handleContinue = async () => {
    if (!isFormValid) return;
    setSubmitting(true);
    setProgress(80);
    setError("");

    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const payload = {
      scout_name: formData.scoutName,
      scout_type: scoutType,
      agency_name: scoutType === "AGENCY" ? formData.agencyName : null,
      country: formData.country,
      city: formData.city,
      phone_number: formData.phoneNumber,
      contact_number: formData.phoneNumber,
    };

    try {
      // Try create first (fresh signup — 99% of cases)
      let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scouts/profile`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      // If a profile already exists (retry), fall back to update
      if (res.status === 409) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scouts/profile`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not save scout profile");
        setSubmitting(false);
        return;
      }

      setProgress(100);
      setTimeout(() => router.push("/dashboard"), 400);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden md:flex-row">
      {/* Left — brand panel */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-[#1C1928] p-8 md:w-1/2 md:p-0">
        <div
          className={`absolute -left-[20%] -top-[20%] h-[70%] w-[70%] rounded-full bg-[#D4AF6A]/10 transition-all duration-1000 ease-in-out ${
            animate ? "scale-110" : "scale-100"
          }`}
        />
        <div
          className={`absolute -bottom-[10%] -right-[10%] h-[60%] w-[60%] rounded-full bg-[#D4AF6A]/5 transition-all delay-300 duration-1000 ease-in-out ${
            animate ? "scale-125" : "scale-100"
          }`}
        />
        <div className="relative z-10 max-w-md text-center text-white md:text-left">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Tell Us Where <span className="gold-font">You Scout</span>
          </h1>
          <p className="mb-8 text-lg text-white/70">
            Your profile stays private until our team verifies it — this keeps player data safe.
          </p>
          <div className="mb-8 space-y-4">
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">Verified badge once approved by our team</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">Search and shortlist players by position</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">Message players and agents directly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full items-center justify-center bg-[#242030] p-8 md:w-1/2 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <Image
              src="/logo-modified.png"
              loading="eager"
              alt="logo"
              className="mx-auto mb-3 h-auto w-auto"
              width={100}
              height={50}
            />
            <h2 className="text-2xl font-bold text-white">Footy Scouts</h2>
            <p className="mt-1 text-sm text-white/50">Your football recruitment network</p>
          </div>

          <div className="mb-10">
            <div className="mb-2 flex justify-between text-sm text-white/50">
              <span>Step 2 of 3</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#D4AF6A] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h3 className="mb-8 text-2xl font-bold text-white">Tell us about your scouting</h3>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mb-10 space-y-6">
            {/* Scout Name */}
            <div className="space-y-2">
              <label htmlFor="scoutName" className="block text-sm font-medium text-white/70">
                Your name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="scoutName"
                value={formData.scoutName}
                onChange={handleInputChange}
                placeholder="e.g. James Mwangi"
                className="block w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[#D4AF6A]/60"
              />
            </div>

            {/* Scout type */}
            <div className="space-y-2">
              <span className="block text-sm font-medium text-white/70">Scouting as</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScoutType("INDIVIDUAL")}
                  className={`rounded-md border-2 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    scoutType === "INDIVIDUAL"
                      ? "border-[#D4AF6A] bg-[#D4AF6A]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/25"
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setScoutType("AGENCY")}
                  className={`rounded-md border-2 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    scoutType === "AGENCY"
                      ? "border-[#D4AF6A] bg-[#D4AF6A]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/25"
                  }`}
                >
                  Agency
                </button>
              </div>
            </div>

            {scoutType === "AGENCY" && (
              <div className="space-y-2">
                <label htmlFor="agencyName" className="block text-sm font-medium text-white/70">
                  Agency Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    id="agencyName"
                    value={formData.agencyName}
                    onChange={handleInputChange}
                    placeholder="e.g. PrimeTalent Sports"
                    className="block w-full rounded-md border border-white/15 bg-white/5 py-3 pl-10 pr-3 text-white outline-none placeholder:text-white/40 focus:border-[#D4AF6A]/60"
                  />
                </div>
              </div>
            )}

            {/* Phone number */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-white/70">
                Phone number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="tel"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. 0712345678 or +254712345678"
                  className="block w-full rounded-md border border-white/15 bg-white/5 py-3 pl-10 pr-3 text-white outline-none placeholder:text-white/40 focus:border-[#D4AF6A]/60"
                />
              </div>
              <p className="text-xs text-white/40">
                Players with premium accounts can call or WhatsApp you here.
              </p>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <label htmlFor="country" className="block text-sm font-medium text-white/70">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  id="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="e.g. Kenya"
                  className="block w-full rounded-md border border-white/15 bg-white/5 py-3 pl-10 pr-3 text-white outline-none placeholder:text-white/40 focus:border-[#D4AF6A]/60"
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm font-medium text-white/70">
                City <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Nairobi"
                  className="block w-full rounded-md border border-white/15 bg-white/5 py-3 pl-10 pr-3 text-white outline-none placeholder:text-white/40 focus:border-[#D4AF6A]/60"
                />
              </div>
            </div>
          </div>

          <button
            className={`flex w-full items-center justify-center rounded-md py-4 text-base font-medium transition-all duration-300 ${
              isFormValid && !submitting
                ? "cursor-pointer bg-[#D4AF6A] text-[#1C1928] hover:bg-[#c9a45f]"
                : "cursor-not-allowed bg-white/10 text-white/30"
            }`}
            onClick={handleContinue}
            disabled={!isFormValid || submitting}
          >
            {submitting ? "Saving..." : "Finish Setting Up"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>

          <p className="mt-6 text-center text-sm text-white/40">
            Your profile will be reviewed before it becomes visible to players.
          </p>
        </div>
      </div>
    </div>
  );
}