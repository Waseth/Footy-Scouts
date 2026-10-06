"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Camera, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Label from "@/components/form/Label";
import Input from "@/components/form/InputField";
import Button from "@/components/elements/Button";
import ImageCropModal from "@/components/ImageCropModal";

const PLAYER_FIELDS = [
  { key: "full_name",      label: "Full name",      placeholder: "e.g. Amani Otieno", required: true },
  { key: "nationality",    label: "Nationality",    placeholder: "e.g. Kenyan" },
  { key: "position",       label: "Position",       placeholder: "e.g. Midfielder" },
  { key: "current_team",   label: "Current team",   placeholder: "e.g. Gor Mahia Youth" },
  { key: "school",         label: "School",         placeholder: "e.g. Alliance High School" },
  { key: "contact_number", label: "Contact number", placeholder: "e.g. +254 700 000 000" },
];

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [scoutProfile, setScoutProfile] = useState(null);
  const [playerForm, setPlayerForm] = useState({});
  const [scoutForm, setScoutForm] = useState({});
  const [showContact, setShowContact] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const playerFileRef = useRef(null);
  const scoutFileRef = useRef(null);

  // Crop modal state
  const [cropFile, setCropFile] = useState(null);
  const [cropKind, setCropKind] = useState(null); // 'player' | 'scout'

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        setUser(me);

        try {
          const res = await api.request("/players/profile");
          const p = res.data.player;
          setPlayerProfile(p);
          setPlayerForm({
            full_name: p.full_name || "",
            nationality: p.nationality || "",
            position: p.position || "",
            current_team: p.current_team || "",
            school: p.school || "",
            contact_number: p.contact_number || "",
            date_of_birth: p.date_of_birth ? p.date_of_birth.split("T")[0] : "",
            gender: p.gender || "",
            biography: p.biography || "",
          });
          setShowContact(!!p.show_contact);
        } catch {
          setPlayerForm({
            full_name: me?.email?.split("@")[0] || "",
            nationality: "",
            position: "",
            current_team: "",
            school: "",
            contact_number: "",
            date_of_birth: "",
            gender: "",
            biography: "",
          });
        }

        try {
          const res = await api.request("/scouts/profile");
          const s = res.data.scout;
          setScoutProfile(s);
          setScoutForm({
            scout_name: s.scout_name || "",
            scout_type: s.scout_type || "INDIVIDUAL",
            agency_name: s.agency_name || "",
            country: s.country || "",
            city: s.city || "",
            contact_number: s.contact_number || "",
            biography: s.biography || "",
          });
        } catch {
          setScoutForm({
            scout_name: "",
            scout_type: "INDIVIDUAL",
            agency_name: "",
            country: "",
            city: "",
            contact_number: "",
            biography: "",
          });
        }
      } catch (e) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    setSuccess("");

    const isPlayer = !!playerForm.full_name || playerProfile;
    const isScout  = !!scoutProfile || !!scoutForm.scout_name;

    const payloads = [];

    if (isPlayer) {
      payloads.push(
        api
          .updatePlayerProfile({
            full_name: playerForm.full_name,
            nationality: playerForm.nationality,
            position: playerForm.position,
            current_team: playerForm.current_team,
            school: playerForm.school,
            contact_number: playerForm.contact_number,
            date_of_birth: playerForm.date_of_birth || null,
            gender: playerForm.gender,
            biography: playerForm.biography,
            show_contact: showContact,
          })
          .catch(async (e) => {
            if (/not found|Create one/i.test(e.message || "")) {
              return api.createPlayerProfile({
                full_name: playerForm.full_name || (user?.email?.split("@")[0] || "New Player"),
                nationality: playerForm.nationality,
                position: playerForm.position,
                current_team: playerForm.current_team,
                school: playerForm.school,
                contact_number: playerForm.contact_number,
                date_of_birth: playerForm.date_of_birth || null,
                gender: playerForm.gender,
                biography: playerForm.biography,
                show_contact: showContact,
              });
            }
            throw e;
          })
      );
    }

    if (isScout) {
      const scoutPayload = {
        scout_name: scoutForm.scout_name,
        scout_type: scoutForm.scout_type,
        agency_name: scoutForm.scout_type === "AGENCY" ? scoutForm.agency_name : null,
        country: scoutForm.country,
        city: scoutForm.city,
        contact_number: scoutForm.contact_number,
        biography: scoutForm.biography,
      };
      payloads.push(
        api.request("/scouts/profile", {
          method: scoutProfile ? "PUT" : "POST",
          body: JSON.stringify(scoutPayload),
        })
      );
    }

    try {
      await Promise.all(payloads);
      setSuccess("Profile saved.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setErrors({ general: e.message || "Could not save profile" });
    } finally {
      setSaving(false);
    }
  };

  // Called when a file is selected — opens the crop modal
  const handleFileSelected = (file, kind) => {
    if (!file) return;
    setCropFile(file);
    setCropKind(kind);
  };

  // Called after the user confirms the crop
  const handleCropComplete = async (blob) => {
    const kind = cropKind;
    setCropFile(null);
    setCropKind(null);
    setUploading(true);
    setErrors({});

    try {
      const fd = new FormData();
      fd.append("file", blob, "profile.jpg");

      const token = api.getToken();
      const endpoint =
        kind === "player"
          ? `${api.baseUrl}/players/profile/picture`
          : `${api.baseUrl}/scouts/profile/picture`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const url = data.data.profile_picture_url;
      if (kind === "player") {
        setPlayerProfile((prev) => ({ ...(prev || {}), profile_picture_url: url }));
      } else {
        setScoutProfile((prev) => ({ ...(prev || {}), profile_picture_url: url }));
      }
      setSuccess("Picture updated.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setErrors({ general: err.message || "Upload failed" });
    } finally {
      setUploading(false);
      if (playerFileRef.current) playerFileRef.current.value = "";
      if (scoutFileRef.current)  scoutFileRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  const hasPlayerProfile = !!playerProfile || !!playerForm.full_name;
  const hasScoutProfile  = !!scoutProfile  || !!scoutForm.scout_name;

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-white/60 mb-8">
          Update your details. Changes are visible immediately.
        </p>

        {errors.general && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {errors.general}
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        {/* Account info (read-only) */}
        <div className="rounded-2xl border border-white/10 bg-[#242030] p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
            </div>
            <div>
              <Label htmlFor="role">Account type</Label>
              <Input id="role" value={user?.role || ""} disabled />
            </div>
          </div>
        </div>

        {/* Player */}
        {hasPlayerProfile && (
          <div className="rounded-2xl border border-white/10 bg-[#242030] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Player profile</h2>
              {playerProfile?.is_premium && (
                <span className="text-xs px-2 py-1 rounded-full bg-[#D4AF6A]/20 text-[#D4AF6A]">
                  Premium
                </span>
              )}
            </div>

            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/10">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#D4AF6A]/20 flex items-center justify-center relative shrink-0">
                {playerProfile?.profile_picture_url ? (
                  <Image
                    src={playerProfile.profile_picture_url}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-3xl text-[#D4AF6A] font-bold">
                    {(playerForm.full_name || user?.email || "?")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <input
                  ref={playerFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelected(e.target.files?.[0], "player")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => playerFileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" /> Change picture
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-white/40">
                  JPG, PNG, or WEBP. Max 10MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLAYER_FIELDS.map((f) => {
                const isEmpty = !playerForm[f.key];
                const showAsterisk = f.required && isEmpty;
                return (
                  <div key={f.key} className={f.key === "full_name" ? "sm:col-span-2" : ""}>
                    <Label htmlFor={`player_${f.key}`}>
                      {f.label} {showAsterisk && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={`player_${f.key}`}
                      value={playerForm[f.key] || ""}
                      onChange={(e) =>
                        setPlayerForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                      error={!!errors[f.key]}
                    />
                  </div>
                );
              })}

              <div>
                <Label htmlFor="player_dob">Date of birth</Label>
                <Input
                  id="player_dob"
                  type="date"
                  value={playerForm.date_of_birth || ""}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({ ...prev, date_of_birth: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="player_gender">Gender</Label>
                <Input
                  id="player_gender"
                  value={playerForm.gender || ""}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  placeholder="e.g. Male / Female"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="player_bio">About you</Label>
                <textarea
                  id="player_bio"
                  value={playerForm.biography || ""}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({ ...prev, biography: e.target.value }))
                  }
                  rows={4}
                  placeholder="A short bio about your playing style, achievements, ambitions…"
                  className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#D4AF6A]/60"
                />
              </div>

              <div className="sm:col-span-2 flex items-start gap-3">
                <input
                  id="show_contact"
                  type="checkbox"
                  checked={showContact}
                  onChange={(e) => setShowContact(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 accent-[#D4AF6A]"
                />
                <label htmlFor="show_contact" className="text-sm text-white/60">
                  Show my contact number to logged-in users on my profile
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Scout */}
        {hasScoutProfile && (
          <div className="rounded-2xl border border-white/10 bg-[#242030] p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Scout profile</h2>

            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/10">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#D4AF6A]/20 flex items-center justify-center relative shrink-0">
                {scoutProfile?.profile_picture_url ? (
                  <Image
                    src={scoutProfile.profile_picture_url}
                    alt="Scout"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-3xl text-[#D4AF6A] font-bold">
                    {(scoutForm.scout_name || "?")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <input
                  ref={scoutFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelected(e.target.files?.[0], "scout")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => scoutFileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" /> Change picture
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="scout_name">
                  Scout / agency name{" "}
                  {!scoutForm.scout_name && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="scout_name"
                  value={scoutForm.scout_name || ""}
                  onChange={(e) =>
                    setScoutForm((prev) => ({ ...prev, scout_name: e.target.value }))
                  }
                  placeholder="e.g. James Mwangi"
                />
              </div>

              <div>
                <Label htmlFor="scout_type">Type</Label>
                <select
                  id="scout_type"
                  value={scoutForm.scout_type || "INDIVIDUAL"}
                  onChange={(e) =>
                    setScoutForm((prev) => ({ ...prev, scout_type: e.target.value }))
                  }
                  className="w-full h-12 rounded-md border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-[#D4AF6A]/60"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="AGENCY">Agency</option>
                </select>
              </div>

              {scoutForm.scout_type === "AGENCY" && (
                <div>
                  <Label htmlFor="agency_name">Agency name</Label>
                  <Input
                    id="agency_name"
                    value={scoutForm.agency_name || ""}
                    onChange={(e) =>
                      setScoutForm((prev) => ({ ...prev, agency_name: e.target.value }))
                    }
                  />
                </div>
              )}

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={scoutForm.country || ""}
                  onChange={(e) =>
                    setScoutForm((prev) => ({ ...prev, country: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={scoutForm.city || ""}
                  onChange={(e) =>
                    setScoutForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="scout_contact">Contact number</Label>
                <Input
                  id="scout_contact"
                  value={scoutForm.contact_number || ""}
                  onChange={(e) =>
                    setScoutForm((prev) => ({ ...prev, contact_number: e.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="scout_bio">About your scouting</Label>
                <textarea
                  id="scout_bio"
                  value={scoutForm.biography || ""}
                  onChange={(e) =>
                    setScoutForm((prev) => ({ ...prev, biography: e.target.value }))
                  }
                  rows={4}
                  placeholder="Regions covered, types of players you look for…"
                  className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#D4AF6A]/60"
                />
              </div>
            </div>
          </div>
        )}

        {!hasPlayerProfile && !hasScoutProfile && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 mb-6 text-sm text-yellow-300">
            You don&apos;t have any profile yet. Complete the{" "}
            <Link href="/onboarding" className="underline">
              onboarding flow
            </Link>{" "}
            first to get started.
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} variant="gold" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
      <Footer />

      {/* Crop modal */}
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onCancel={() => {
            setCropFile(null);
            setCropKind(null);
            if (playerFileRef.current) playerFileRef.current.value = "";
            if (scoutFileRef.current) scoutFileRef.current.value = "";
          }}
          onComplete={handleCropComplete}
          aspect={1}
        />
      )}
    </div>
  );
}