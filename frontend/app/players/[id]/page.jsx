"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Building2, ShieldCheck, Mail, Phone,
  Globe, ChevronRight, Award, Lock, Star,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumBadge from "@/components/PremiumBadge";

export default function ScoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [scout, setScout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [contactReveal, setContactReveal] = useState(null);
  const [contactError, setContactError] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    setIsAuthed(api.isAuthenticated());
  }, []);

  useEffect(() => {
    const fetchScout = async () => {
      try {
        const data = await api.getScout(params.id);
        setScout(data);
      } catch (err) {
        setError(err.message || "Scout not found");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchScout();
  }, [params.id]);

  const handleContact = async () => {
    // Guest → login with intent, then return here
    if (!isAuthed) {
      const redirect = encodeURIComponent(`/scouts/${params.id}?intent=contact_scout`);
      router.push(`/login?redirect=${redirect}&intent=contact_scout`);
      return;
    }
    setContactError(null);
    setContactLoading(true);
    try {
      const data = await api.contactScout(params.id);
      setContactReveal(data.scout);
    } catch (err) {
      const msg = err.message || "";
      // If premium required, push to pricing with reason
      if (msg.toLowerCase().includes("premium")) {
        router.push(`/pricing?reason=contact_scout`);
        return;
      }
      setContactError(msg || "Could not contact scout");
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="animate-pulse">
            <div className="h-8 bg-[#242030] rounded w-1/4 mb-6" />
            <div className="bg-[#242030] rounded-lg p-6 border border-white/10">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3"><div className="aspect-square bg-white/10 rounded-lg" /></div>
                <div className="flex-1 space-y-4">
                  <div className="h-10 bg-white/10 rounded w-3/4" />
                  <div className="h-6 bg-white/10 rounded w-1/2" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !scout) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Scout Not Found</h1>
          <p className="text-white/60 mb-6">{error || "The scout you're looking for doesn't exist."}</p>
          <Link href="/scouts" className="text-[#D4AF6A] hover:underline">← Back to Scouts</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/scouts" className="hover:text-white/60 transition">Scouts</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white/80">{scout.scout_name}</span>
        </div>

        <Link href="/scouts" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6">
          <ArrowLeft className="w-5 h-5" /> Back to Scouts
        </Link>

        <div className="bg-[#242030] rounded-xl border border-white/10 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 bg-[#1C1928] relative">
              <div className="aspect-square relative">
                {scout.profile_picture_url ? (
                  <Image src={scout.profile_picture_url} alt={scout.scout_name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#2A2438]">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto rounded-full bg-[#D4AF6A]/20 flex items-center justify-center mb-4">
                        <span className="text-4xl text-[#D4AF6A]">{scout.scout_name?.charAt(0) || "S"}</span>
                      </div>
                      <p className="text-white/40 text-sm">No image available</p>
                    </div>
                  </div>
                )}
                {scout.is_verified && (
                  <div className="absolute top-4 right-4 bg-[#D4AF6A] text-[#1C1928] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Verified
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-6 md:p-8">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white">{scout.scout_name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="px-3 py-1 rounded-full bg-[#D4AF6A]/20 text-[#D4AF6A] text-sm font-medium">
                      {scout.scout_type === "AGENCY" ? "Agency" : "Individual Scout"}
                    </span>
                    {scout.is_premium && <PremiumBadge />}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {scout.scout_type === "AGENCY" && scout.agency_name && (
                  <InfoRow icon={Building2} label={scout.agency_name} />
                )}
                {scout.country && <InfoRow icon={Globe} label={scout.country} />}
                {scout.city && <InfoRow icon={MapPin} label={scout.city} />}
                {scout.is_verified && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Award className="w-5 h-5 text-[#D4AF6A]" />
                    <span className="text-green-400">Verified Account</span>
                  </div>
                )}
              </div>

              {scout.biography && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-2">About</h3>
                  <p className="text-white/60 leading-relaxed">{scout.biography}</p>
                </div>
              )}

              {/* Contact area */}
              <div className="mt-6 pt-6 border-t border-white/10">
                {contactReveal ? (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Contact</h3>
                    <div className="flex flex-wrap gap-4">
                      {contactReveal.contact_number && <InfoRow icon={Phone} label={contactReveal.contact_number} />}
                      {contactReveal.email && <InfoRow icon={Mail} label={contactReveal.email} />}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg bg-[#1C1928] border border-[#D4AF6A]/20 p-4">
                    <Lock className="w-5 h-5 text-[#D4AF6A] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white font-medium">Contact this scout</p>
                      <p className="text-white/60 text-sm mt-1">
                        {!isAuthed
                          ? "Log in to get in touch. Contacting scouts requires a premium account."
                          : "Premium accounts can reach out to verified scouts directly."}
                      </p>
                      {contactError && (
                        <p className="text-red-400 text-sm mt-2">{contactError}</p>
                      )}
                      <button
                        onClick={handleContact}
                        disabled={contactLoading}
                        className="mt-3 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
                      >
                        {contactLoading ? "Please wait…" : isAuthed ? "Contact Scout" : "Log in to contact"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function InfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 text-white/70">
      <Icon className="w-5 h-5 text-[#D4AF6A]" />
      <span>{label}</span>
    </div>
  );
}