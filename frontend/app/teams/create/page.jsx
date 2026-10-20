"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Shield, Upload, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageCropModal from "@/components/ImageCropModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/InputField";
import Button from "@/components/elements/Button";

export default function CreateTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [error, setError] = useState("");
  const [cropFile, setCropFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        setUser(me);
        if (!me.player_profile && me.role !== "PLAYER") {
          setError(
            "You need a player profile to create a team. Complete your player onboarding first."
          );
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
  };

  const handleCropComplete = (blob) => {
    setCropFile(null);
    // Store as a File-like object; upload after team is created
    const file = new File([blob], "team-logo.jpg", { type: "image/jpeg" });
    setLogoUrl({ pending: true, file, preview: URL.createObjectURL(blob) });
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) {
      setError("Team name is required");
      return;
    }

    setSubmitting(true);
    try {
      const team = await api.createTeam({
        name: name.trim(),
        description: description.trim() || null,
      });

      // Upload logo if user picked one
      if (logoUrl?.pending && logoUrl.file) {
        try {
          setUploading(true);
          await api.uploadTeamLogo(team.id, logoUrl.file);
        } catch (e) {
          console.error("Logo upload failed:", e);
          // Don't block team creation — user can retry from manage page
        } finally {
          setUploading(false);
        }
      }

      router.push(`/teams/${team.id}/manage`);
    } catch (e) {
      setError(e.message || "Could not create team");
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
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
        <Link
          href="/dashboard/teams"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to my teams
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Create a team</h1>
        <p className="text-white/60 mb-8">
          You'll be the captain. Once created, you can invite players and enter tournaments.
        </p>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#242030] p-6 space-y-5">
          {/* Logo */}
          <div>
            <Label>Team logo (optional)</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-[#1C1928] border border-white/10 flex items-center justify-center overflow-hidden">
                {logoUrl?.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl.preview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-8 h-8 text-[#D4AF6A]/40" />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/10 transition disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" /> Choose image
                </button>
                <p className="mt-1 text-xs text-white/40">JPG, PNG, or WEBP. Max 10MB.</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="team_name">
              Team name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="team_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Black Stars FC"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="team_desc">Description (optional)</Label>
            <textarea
              id="team_desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A short description of your team..."
              className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#D4AF6A]/60"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSubmit} variant="gold" disabled={submitting || uploading}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploading ? "Uploading logo…" : "Creating team…"}
                </>
              ) : (
                "Create team"
              )}
            </Button>
            <Link
              href="/dashboard/teams"
              className="rounded-md border border-white/20 text-white px-5 py-3 text-sm hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
      <Footer />

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onCancel={() => {
            setCropFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          onComplete={handleCropComplete}
          aspect={1}
        />
      )}
    </div>
  );
}