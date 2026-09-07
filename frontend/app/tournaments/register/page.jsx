'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Users, Mail, Phone, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TournamentRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [participantType, setParticipantType] = useState('INDIVIDUAL');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    phone: '',
    teamName: '',
    teamRepresentative: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const id = params.id;
        const data = await api.getTournament(id);
        setTournament(data);
      } catch (err) {
        setError(err.message || 'Tournament not found');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTournament();
    }
  }, [params.id]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        participant_type: participantType,
        ...(participantType === 'INDIVIDUAL' ? {
          name: formData.name,
          age: parseInt(formData.age) || null,
          email: formData.email,
          phone: formData.phone,
        } : {
          team_name: formData.teamName,
          team_representative: formData.teamRepresentative,
          email: formData.email,
          phone: formData.phone,
        }),
      };

      const id = params.id;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/tournaments/${id}`);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
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
              <div className="h-8 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-4 bg-white/10 rounded w-1/3 mb-8" />
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-white/10 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Tournament Not Found</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Link href="/tournaments" className="text-[#D4AF6A] hover:underline">
            ← Back to Tournaments
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto bg-[#242030] rounded-xl border border-white/10 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
            <p className="text-white/60 mb-6">
              You have successfully registered for {tournament?.tournament_name}.
            </p>
            <div className="bg-[#1C1928] rounded-lg p-4 mb-6 text-left">
              <p className="text-white/40 text-sm">Registration Fee</p>
              <p className="text-white font-semibold">
                {tournament?.registration_fee && tournament.registration_fee > 0
                  ? `${tournament?.fee_currency} ${tournament?.registration_fee}`
                  : 'Free'}
              </p>
              {tournament?.registration_fee && tournament.registration_fee > 0 && (
                <p className="text-white/40 text-sm mt-2">
                  Please pay the registration fee directly to the organizer.
                </p>
              )}
            </div>
            <Link
              href={`/tournaments/${params.id}`}
              className="inline-block px-6 py-2.5 rounded-lg bg-[#D4AF6A] text-[#1C1928] font-semibold hover:bg-[#D4AF6A]/90 transition"
            >
              Back to Tournament
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Link
            href={`/tournaments/${params.id}`}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Tournament
          </Link>

          {/* Registration Form */}
          <div className="bg-[#242030] rounded-xl border border-white/10 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Register for {tournament?.tournament_name}
            </h1>
            <p className="text-white/60 text-sm mb-6">
              Complete the form below to register for this tournament.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Participant Type */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Participant Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setParticipantType('INDIVIDUAL')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                      participantType === 'INDIVIDUAL'
                        ? 'border-[#D4AF6A] bg-[#D4AF6A]/10 text-white'
                        : 'border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantType('TEAM')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                      participantType === 'TEAM'
                        ? 'border-[#D4AF6A] bg-[#D4AF6A]/10 text-white'
                        : 'border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    Team
                  </button>
                </div>
              </div>

              {participantType === 'INDIVIDUAL' ? (
                <>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-white/70 mb-1">
                      Age
                    </label>
                    <input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="18"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-white/70 mb-1">
                      Team Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="teamName"
                      type="text"
                      value={formData.teamName}
                      onChange={handleInputChange}
                      placeholder="FC United"
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="teamRepresentative" className="block text-sm font-medium text-white/70 mb-1">
                      Team Representative <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="teamRepresentative"
                      type="text"
                      value={formData.teamRepresentative}
                      onChange={handleInputChange}
                      placeholder="Coach John"
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white/70 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0712345678"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF6A]/60 outline-none transition"
                />
              </div>

              <div className="bg-[#1C1928] rounded-lg p-4">
                <p className="text-white/40 text-sm">Registration Fee</p>
                <p className="text-white font-semibold">
                  {tournament?.registration_fee && tournament.registration_fee > 0
                    ? `${tournament?.fee_currency} ${tournament?.registration_fee}`
                    : 'Free'}
                </p>
                {tournament?.registration_fee && tournament.registration_fee > 0 && (
                  <p className="text-white/40 text-sm mt-1">
                    Payment will be processed directly with the organizer.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-[#D4AF6A] text-[#1C1928] font-semibold hover:bg-[#D4AF6A]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Registering...' : 'Register Now'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}