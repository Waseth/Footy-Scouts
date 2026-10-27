"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Building2, ShieldCheck, Phone,
  Globe, ChevronRight, Award, MessageCircle, Mail,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactScoutModal from "@/components/ContactScoutModal";

const TYPE_LABELS = {
  SCHOOL: "School",
  TEAM: "Team / Club",
  ACADEMY: "Academy",
  FOOTBALL_ORGANIZATION: "Football Organization",
};

export default function InstitutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const authed = api.isAuthenticated();
    setIsAuthed(authed);
    if (!authed) return;
    api
      .getMe()
      .then((me) => setIsPremium(!!me.is_premium))
      .catch(() => {
        setIsAuthed(false);
        setIsPremium(false);
      });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getInstitution(params.id);
        setInstitution(data);
      } catch (err) {
        setError(err.message || "Institution not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const handleContact = async (kind) => {
    if (!isAuthed) {
      const redirect = encodeURIComponent(
        `/institutions/${params.id}?intent=contact_institution`
      );
      router.push(`/login?redirect=${redirect}&intent=contact_institution`);
      return;
    }
    if (!isPremium) {
      setShowModal(true);
      return;
    }
    try {
      let info = contactInfo;
      if (!info) {
        const res = await api.request(
          `/institutions/${params.id}/contact-info`
        );
        info = res.data;
        setContactInfo(info);
      }
      if (kind === "email") {
        if (!info.email) {
          alert("This institution has no email on file.");
          return;
        }
        window.location.href = `mailto:${info.email}`;
        return;
      }
      const phone = info.contact_number;
      if (!phone) {
        alert("This institution has no phone number on file.");
        return;
      }
      if (kind === "call") {
        window.location.href = `tel:${phone}`;
      } else {
        window.open(
          `https://wa.me/${phone.replace(/[^0-9]/g, "")}`,
          "_blank"
        );
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("premium")) {
        setShowModal(true);
      } else {
        alert(msg || "Could not fetch contact info");
      }
    }
  };

  const backHref = isAuthed ? "/institutions" : "/";
  const backLabel = isAuthed ? "Back to institutions" : "Back home";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="animate-pulse">
            <div className="h-8 bg-[#242030] rounded w-1/4 mb-6" />
            <div className="bg-[#242030] rounded-lg p-6 border border-white/10">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3">
                  <div className="aspect-square bg-white/10 rounded-lg" />
                </div>
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

  if (error || !institution) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Institution Not Found
          </h1>
          <p className="text-white/60 mb-6">
            {error || "The institution you're looking for doesn't exist."}
          </p>
          <Link href="/" className="text-[#D4AF6A] hover:underline">
            ← Back home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white/60 transition">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          {isAuthed && (
            <>
              <Link
                href="/institutions"
                className="hover:text-white/60 transition"
              >
                Institutions
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-white/80">{institution.institution_name}</span>
        </div>

        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {backLabel}
        </Link>

        <div className="bg-[#242030] rounded-xl border border-white/10 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 bg-[#1C1928] relative">
              <div className="aspect-square relative">
                {institution.logo_url ? (
                  <Image
                    src={institution.logo_url}
                    alt={institution.institution_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#2A2438]">
                    <div className="text-center">
                      <Building2 className="w-16 h-16 text-[#D4AF6A]/50 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">No logo</p>
                    </div>
                  </div>
                )}
                {institution.is_verified && (
                  <div className="absolute top-4 right-4 bg-[#D4AF6A] text-[#1C1928] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Verified
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-6 md:p-8">
              <h1 className="text-3xl font-bold text-white">
                {institution.institution_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-full bg-[#D4AF6A]/20 text-[#D4AF6A] text-sm font-medium">
                  {TYPE_LABELS[institution.institution_type] ||
                    institution.institution_type}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {institution.country && (
                  <InfoRow icon={Globe} label={institution.country} />
                )}
                {institution.city && (
                  <InfoRow icon={MapPin} label={institution.city} />
                )}
                {institution.is_verified && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Award className="w-5 h-5 text-[#D4AF6A]" />
                    <span className="text-green-400">Verified Institution</span>
                  </div>
                )}
              </div>

              {institution.description && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-2">About</h3>
                  <p className="text-white/60 leading-relaxed">
                    {institution.description}
                  </p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-white font-semibold mb-3">Contact</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleContact("call")}
                    className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
                  >
                    <Phone className="w-4 h-4" /> Call
                  </button>
                  <button
                    onClick={() => handleContact("whatsapp")}
                    className="inline-flex items-center gap-2 rounded-md border border-green-500/40 text-green-400 px-4 py-2.5 text-sm font-medium hover:bg-green-500/10 transition"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleContact("email")}
                    className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-4 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/10 transition"
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                </div>
                <p className="mt-2 text-xs text-white/40">
                  {isAuthed && isPremium
                    ? "You have premium access."
                    : isAuthed
                    ? "Premium account required to contact institutions."
                    : "Log in with a premium account to contact institutions."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <ContactScoutModal
        open={showModal}
        onClose={() => setShowModal(false)}
        scoutName={institution.institution_name}
        reason="contact_institution"
      />
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