"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [progress, setProgress] = useState(15);
  const [animate, setAnimate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setProgress(30);
  };

  const handleContinue = async () => {
    if (!selectedOption) return;
    setSubmitting(true);
    setProgress(50);
    // No backend call here — role was set at signup.
    // Just route to the role-specific step.
    const target =
      selectedOption === "PLAYER" ? "/onboarding/player" : "/onboarding/scout";
    setTimeout(() => router.push(target), 400);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden md:flex-row">
      {/* Left — brand panel */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-[#1C1928] p-8 md:w-1/2 md:p-0">
        <div
          className={`absolute left-[20%] top-[20%] h-[70%] w-[70%] rounded-full bg-[#D4AF6A]/10 transition-all duration-1000 ease-in-out ${
            animate ? "scale-110" : "scale-100"
          }`}
        />
        <div className="relative z-10 max-w-md text-center text-white md:text-left">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Begin Your <span className="gold-font">Journey</span> With Footy Scouts
          </h1>
          <p className="mb-8 text-lg text-white/70">
            Join players, coaches, scouts and clubs already building their football future on the network.
          </p>
          <div className="mb-8 space-y-4">
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">A profile built for how scouts actually search</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — pick role */}
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
            <p className="mt-1 text-sm text-white/50">
              Your football recruitment network
            </p>
          </div>

          <div className="mb-10">
            <div className="mb-2 flex justify-between text-sm text-white/50">
              <span>Step 1 of 3</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#D4AF6A] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h3 className="mb-6 text-2xl font-bold text-white">
            What best describes you?
          </h3>

          <div className="space-y-3 mb-10">
            {[
              { id: "PLAYER", title: "I'm a Player", desc: "Get discovered by scouts" },
              { id: "SCOUT",  title: "I'm a Scout",  desc: "Find talented players" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`w-full rounded-lg border-2 p-4 text-left transition ${
                  selectedOption === opt.id
                    ? "border-[#D4AF6A] bg-[#D4AF6A]/10"
                    : "border-white/10 bg-white/5 hover:border-white/25"
                }`}
              >
                <h4 className="text-white font-semibold">{opt.title}</h4>
                <p className="text-white/60 text-sm">{opt.desc}</p>
              </button>
            ))}
          </div>

          <button
            className={`flex w-full items-center justify-center rounded-md py-4 text-base font-medium transition-all duration-300 ${
              selectedOption
                ? "cursor-pointer bg-[#D4AF6A] text-[#1C1928] hover:bg-[#D4AF6A]/90"
                : "cursor-not-allowed bg-white/10 text-white/30"
            }`}
            onClick={handleContinue}
            disabled={!selectedOption || submitting}
          >
            {submitting ? "Continuing…" : "Continue"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}