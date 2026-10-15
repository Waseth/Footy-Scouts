"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Upload, Trash2, Loader2, AlertCircle, Pencil, X,
  Film, Image as ImageIcon, FileText, Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumCTA from "@/components/PremiumCTA";
import ConfirmModal from "@/components/ConfirmModal";

export default function MediaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([]);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadType, setUploadType] = useState("IMAGE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef(null);

  // Custom confirm modal state
  const [confirmState, setConfirmState] = useState(null);

  // Edit-details modal state
  const [editItem, setEditItem] = useState(null); // { id, title, description }
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        setUser(me);
        const res = await api.request("/players/media");
        setMedia(res.data.media || []);
      } catch (e) {
        if (e.message?.toLowerCase().includes("unauthorized")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const token = api.getToken();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("media_type", uploadType);
      fd.append("title", title);
      fd.append("description", description);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.errors?.code === "PREMIUM_REQUIRED") {
          router.push("/pricing?reason=upload_highlights");
          return;
        }
        throw new Error(data.error || "Upload failed");
      }

      setMedia((prev) => [data.data.media, ...prev]);
      // Clear form after upload
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteClick = (item) => {
    setConfirmState({
      title: "Delete this item?",
      body: item.title
        ? `"${item.title}" will be permanently removed.`
        : "This item will be permanently removed.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        try {
          await api.request(`/players/media/${item.id}`, { method: "DELETE" });
          setMedia((prev) => prev.filter((m) => m.id !== item.id));
        } catch (e) {
          setError(e.message);
        }
      },
    });
  };

  const handleEditOpen = (item) => {
    setEditItem({
      id: item.id,
      title: item.title || "",
      description: item.description || "",
    });
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    setSavingEdit(true);
    try {
      const updated = await api.updateMediaDetails(editItem.id, {
        title: editItem.title,
        description: editItem.description,
      });
      setMedia((prev) =>
        prev.map((m) => (m.id === editItem.id ? { ...m, ...updated } : m))
      );
      setEditItem(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  const isPremium = user?.is_premium;

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Highlights &amp; Media</h1>
        <p className="text-white/60 mb-8">
          Upload images, videos, and PDFs to showcase yourself to scouts.
        </p>

        {!isPremium && <PremiumCTA variant="banner" />}

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Upload panel */}
        <div className="rounded-2xl border border-white/10 bg-[#242030] p-6 mb-8">
          <h2 className="text-white font-semibold mb-4">Upload new</h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { v: "IMAGE", label: "Image",  Icon: ImageIcon, premiumOnly: false },
              { v: "VIDEO", label: "Video",  Icon: Film,      premiumOnly: true  },
              { v: "PDF",   label: "PDF CV", Icon: FileText,  premiumOnly: false },
            ].map(({ v, label, Icon, premiumOnly }) => {
              const locked = premiumOnly && !isPremium;
              const active = uploadType === v;
              return (
                <button
                  key={v}
                  onClick={() => {
                    if (locked) {
                      router.push("/pricing?reason=upload_highlights");
                      return;
                    }
                    setUploadType(v);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-lg border p-3 text-sm transition ${
                    active
                      ? "border-[#D4AF6A] bg-[#D4AF6A]/10 text-white"
                      : "border-white/10 text-white/60 hover:border-[#D4AF6A]/40"
                  }`}
                >
                  {locked && <Lock className="w-3 h-3 absolute top-2 right-2 text-[#D4AF6A]" />}
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Title / Description FIRST */}
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4AF6A]/60"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full mb-4 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4AF6A]/60"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept={uploadType === "IMAGE" ? "image/*" : uploadType === "VIDEO" ? "video/*" : ".pdf"}
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="w-4 h-4" /> Choose file &amp; upload</>
            )}
          </button>
        </div>

        {/* Media grid */}
        <h2 className="text-white font-semibold mb-4">
          Your media ({media.length})
        </h2>
        {media.length === 0 ? (
          <p className="text-white/40 text-sm">No media uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {media.map((m) => (
              <div
                key={m.id}
                className="group relative rounded-lg overflow-hidden border border-white/10 bg-[#242030]"
              >
                {m.media_type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.title || ""}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center aspect-square text-white/60 hover:text-white"
                  >
                    {m.media_type === "VIDEO" ? (
                      <Film className="w-8 h-8 mb-2" />
                    ) : (
                      <FileText className="w-8 h-8 mb-2" />
                    )}
                    <span className="text-xs px-2 text-center">
                      {m.title || m.media_type}
                    </span>
                  </a>
                )}

                {/* Title bar at bottom of tile */}
                {(m.title || m.description) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    {m.title && (
                      <p className="text-white text-xs font-medium truncate">{m.title}</p>
                    )}
                    {m.description && (
                      <p className="text-white/70 text-[10px] truncate">{m.description}</p>
                    )}
                  </div>
                )}

                {/* Action buttons (hover) */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleEditOpen(m)}
                    className="rounded-md bg-white/10 backdrop-blur text-white p-1.5 hover:bg-[#D4AF6A] hover:text-[#1C1928] transition"
                    title="Edit details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(m)}
                    className="rounded-md bg-red-500/80 backdrop-blur text-white p-1.5 hover:bg-red-500 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />

      {/* Edit details modal */}
      {editItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setEditItem(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#242030] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Edit details</h3>
              <button
                onClick={() => setEditItem(null)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="text-xs text-white/50 mb-1 block">Title</label>
            <input
              type="text"
              value={editItem.title}
              onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
              className="w-full mb-4 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF6A]/60"
            />

            <label className="text-xs text-white/50 mb-1 block">Description</label>
            <textarea
              value={editItem.description}
              onChange={(e) =>
                setEditItem({ ...editItem, description: e.target.value })
              }
              rows={3}
              className="w-full mb-4 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF6A]/60"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setEditItem(null)}
                className="flex-1 rounded-md border border-white/20 text-white px-4 py-2.5 text-sm hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={savingEdit}
                className="flex-1 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
              >
                {savingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom delete confirmation */}
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}