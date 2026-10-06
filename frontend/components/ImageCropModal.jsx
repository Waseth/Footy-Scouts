"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, RotateCw } from "lucide-react";

/**
 * Square image cropper modal.
 *
 * Usage:
 *   <ImageCropModal
 *     file={file}                      // File to crop
 *     onCancel={() => setFile(null)}
 *     onComplete={(blob) => upload(blob)}
 *   />
 */
export default function ImageCropModal({ file, onCancel, onComplete, aspect = 1 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(file, croppedAreaPixels, rotation);
      onComplete(blob);
    } catch (err) {
      console.error("Crop failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const imageUrl = URL.createObjectURL(file);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#242030] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold">Crop your picture</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/60 hover:text-white transition"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full" style={{ height: "360px", backgroundColor: "#000" }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-xs text-white/50 mb-2">
              <ZoomIn className="w-4 h-4" /> Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#D4AF6A]"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-white/50 mb-2">
              <RotateCw className="w-4 h-4" /> Rotation
            </label>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-[#D4AF6A]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-white/20 text-white px-4 py-2 text-sm hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={processing}
            className="rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
          >
            {processing ? "Processing…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers: crop to Blob via canvas ──
async function getCroppedBlob(file, cropPixels, rotation) {
  const image = await loadImage(URL.createObjectURL(file));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const rotRad = (rotation * Math.PI) / 180;

  // Bounding box of rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotRad
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate so rotation happens around center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Extract cropped region
  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = cropPixels.width;
  croppedCanvas.height = cropPixels.height;

  const croppedCtx = croppedCanvas.getContext("2d");
  croppedCtx.drawImage(
    canvas,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92
    );
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
    // Allow cross-origin images (Cloudinary already sends CORS headers)
    img.crossOrigin = "anonymous";
  });
}

function rotateSize(width, height, rotation) {
  const rotRad = rotation;
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}