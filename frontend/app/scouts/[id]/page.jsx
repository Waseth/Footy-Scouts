'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  Globe,
  ChevronRight,
  User,
  Award
} from 'lucide-react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ScoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [scout, setScout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScout = async () => {
      try {
        const id = params.id;
        const data = await api.getScout(id);
        setScout(data);
      } catch (err) {
        setError(err.message || 'Scout not found');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchScout();
    }
  }, [params.id]);

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
                  <div className="h-4 bg-white/10 rounded w-3/4" />
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
          <p className="text-white/60 mb-6">{error || 'The scout you\'re looking for doesn\'t exist.'}</p>
          <Link href="/scouts" className="text-[#D4AF6A] hover:underline">
            ← Back to Scouts
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/scouts" className="hover:text-white/60 transition">Scouts</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white/80">{scout.scout_name}</span>
        </div>

        {/* Back Button */}
        <Link
          href="/scouts"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Scouts
        </Link>

        {/* Scout Profile */}
        <div className="bg-[#242030] rounded-xl border border-white/10 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left - Image */}
            <div className="w-full md:w-1/3 bg-[#1C1928] relative">
              <div className="aspect-square relative">
                {scout.profile_picture_url ? (
                  <Image
                    src={scout.profile_picture_url}
                    alt={scout.scout_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#2A2438]">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto rounded-full bg-[#D4AF6A]/20 flex items-center justify-center mb-4">
                        <span className="text-4xl text-[#D4AF6A]">
                          {scout.scout_name?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <p className="text-white/40 text-sm">No image available</p>
                    </div>
                  </div>
                )}
                {scout.is_verified && (
                  <div className="absolute top-4 right-4 bg-[#D4AF6A] text-[#1C1928] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>
            </div>

            {/* Right - Details */}
            <div className="flex-1 p-6 md:p-8">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white">{scout.scout_name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="px-3 py-1 rounded-full bg-[#D4AF6A]/20 text-[#D4AF6A] text-sm font-medium">
                      {scout.scout_type === 'AGENCY' ? 'Agency' : 'Individual Scout'}
                    </span>
                    {scout.is_premium && (
                      <span className="px-3 py-1 rounded-full bg-[#D4AF6A]/10 text-[#D4AF6A] text-sm font-medium">
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {scout.scout_type === 'AGENCY' && scout.agency_name && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Building2 className="w-5 h-5 text-[#D4AF6A]" />
                    <span>{scout.agency_name}</span>
                  </div>
                )}
                {scout.country && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Globe className="w-5 h-5 text-[#D4AF6A]" />
                    <span>{scout.country}</span>
                  </div>
                )}
                {scout.city && (
                  <div className="flex items-center gap-3 text-white/70">
                    <MapPin className="w-5 h-5 text-[#D4AF6A]" />
                    <span>{scout.city}</span>
                  </div>
                )}
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

              {/* Contact - Only if scout allows */}
              {scout.contact_number && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-white font-semibold mb-3">Contact</h3>
                  <div className="flex flex-wrap gap-4">
                    {scout.contact_number && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Phone className="w-5 h-5 text-[#D4AF6A]" />
                        <span>{scout.contact_number}</span>
                      </div>
                    )}
                    {scout.email && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Mail className="w-5 h-5 text-[#D4AF6A]" />
                        <span>{scout.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}