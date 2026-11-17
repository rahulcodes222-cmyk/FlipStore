"use client";

import { useRef, useState } from "react";
import { Upload, ArrowUp, ArrowDown, X, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadImage = { id: string; url: string; alt?: string; isPrimary: boolean };

interface ProductImageUploaderProps {
  images: UploadImage[];
  onChange: (images: UploadImage[]) => void;
  maxImages?: number;
  className?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", "products");
  const res = await fetch(`${API_BASE}/api/v1/uploads`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || "Image upload failed.");
  }
  const url = json?.data?.url;
  if (!url) throw new Error("Upload did not return an image URL.");
  return String(url);
}

export function ProductImageUploader({
  images,
  onChange,
  maxImages = 5,
  className,
}: ProductImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || uploading) return;
    setError(null);
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const availableSlots = Math.max(0, maxImages - images.length);
    const toAdd = files.slice(0, availableSlots);
    if (toAdd.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        toAdd.map(async (file, idx) => {
          const url = await uploadFile(file);
          return {
            id: `img-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            url,
            alt: file.name.replace(/\.[^.]+$/, "") || "Product image",
            isPrimary: false,
          } as UploadImage;
        })
      );

      const merged = [...images, ...uploaded];
      if (merged.length && !merged.some((i) => i.isPrimary)) merged[0].isPrimary = true;
      onChange(merged);
    } catch (e: any) {
      setError(e?.message || "Failed to upload image(s).");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    const next = images.filter((i) => i.id !== id);
    if (next.length && !next.some((i) => i.isPrimary)) next[0].isPrimary = true;
    onChange(next);
  };

  const setPrimary = (id: string) => {
    onChange(images.map((i) => ({ ...i, isPrimary: i.id === id })));
  };

  const moveImage = (id: string, direction: "up" | "down") => {
    const idx = images.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= images.length) return;
    const next = [...images];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-sm p-4 flex flex-col items-center gap-3 transition-all",
          dragOver ? "bg-[#2874F0]/10 border-[#2874F0]" : "bg-[#F9FAFB] border-[#E0E0E0] hover:bg-[#F1F3F6]"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id="product-image-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          onChange={(e) => void handleFiles(e.target.files)}
          className="sr-only"
        />
        <div className="flex flex-col items-center gap-2 text-center">
          {uploading ? <Loader2 size={24} className="text-[#2874F0] animate-spin" /> : <Upload size={24} className={cn("text-[#2874F0]", dragOver ? "animate-bounce" : "")} />}
          <p className="text-xs text-[#878787]">
            {uploading ? "Uploading image(s)…" : "Drag & drop images or click to upload"}
          </p>
          <p className="text-[11px] text-[#9E9E9E]">JPG, PNG, WEBP, GIF, AVIF up to 5MB each</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || images.length >= maxImages}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={14} className="mr-1.5" /> Choose files
          </Button>
        </div>
      </div>

      {error ? <p className="text-xs text-[#D32F2F]">{error}</p> : null}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full max-w-xl">
          {images.map((img, index) => (
            <div key={img.id} className="relative group rounded-sm border border-[#E0E0E0] overflow-hidden bg-white">
              <img src={img.url} alt={img.alt || "Product image"} className="w-full h-24 object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute top-1 right-1 bg-[#E53935] text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
              {!img.isPrimary && (
                <button
                  type="button"
                  onClick={() => setPrimary(img.id)}
                  className="absolute bottom-1 left-1 bg-[#2874F0] text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Set as primary"
                  title="Set as primary"
                >
                  <span className="text-[10px] font-bold">★</span>
                </button>
              )}
              {img.isPrimary && (
                <span className="absolute bottom-1 left-1 bg-[#388E3C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
              <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveImage(img.id, "up"); }}
                  className="bg-white/95 text-[#212121] rounded-sm h-5 w-5 flex items-center justify-center shadow-sm"
                  aria-label="Move up"
                  disabled={index === 0}
                >
                  <ArrowUp size={10} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveImage(img.id, "down"); }}
                  className="bg-white/95 text-[#212121] rounded-sm h-5 w-5 flex items-center justify-center shadow-sm"
                  aria-label="Move down"
                  disabled={index === images.length - 1}
                >
                  <ArrowDown size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length >= maxImages && (
        <p className="text-xs text-[#878787]">Maximum {maxImages} images reached.</p>
      )}
    </div>
  );
}