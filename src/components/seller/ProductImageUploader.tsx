"use client";

import { useState } from "react";
import { Upload, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImageUploaderProps {
  images: { id: string; url: string; alt?: string; isPrimary: boolean }[];
  onChange: (images: { id: string; url: string; alt?: string; isPrimary: boolean }[]) => void;
  maxImages?: number;
  className?: string;
}

export function ProductImageUploader({
  images,
  onChange,
  maxImages = 5,
  className,
}: ProductImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const availableSlots = maxImages - images.length;
    const toAdd = files.slice(0, availableSlots);
    const newImages = toAdd.map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: URL.createObjectURL(file),
      alt: file.name,
      isPrimary: false,
    }));
    onChange([...images, ...newImages]);
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
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    const img = images.find((i) => i.id === id);
    if (img && !img.isPrimary) {
      URL.revokeObjectURL(img.url);
    }
    onChange(images.filter((i) => i.id !== id));
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
    <div
      className={cn("border-2 border-dashed rounded-sm p-4 flex flex-col items-center gap-3 transition-all", dragOver ? "bg-[#2874F0]/10 border-[#2874F0]" : "bg-[#F9FAFB] border-[#E0E0E0] hover:bg-[#F1F3F6]", className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="sr-only" />
      <div className="flex flex-col items-center gap-2">
        <Upload size={24} className={cn("text-[#2874F0]", dragOver ? "animate-bounce" : "")} />
        <p className="text-xs text-[#878787]">Drag & drop images or click to upload</p>
        <Button variant="outline" size="sm" onClick={() => (document.getElementById("product-image-upload") as HTMLInputElement).click()}>
          Choose files
        </Button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full max-w-xs">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.url} alt={img.alt || ""} className="w-full h-20 object-cover rounded-sm border border-[#E0E0E0]" />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute -top-1 -right-1 bg-[#E53935] text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
              {!img.isPrimary && (
                <button
                  type="button"
                  onClick={() => setPrimary(img.id)}
                  className="absolute bottom-1 left-1 bg-[#2874F0] text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Set as primary"
                >
                  <span className="text-[9px] font-bold">★</span>
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
                  className="bg-white text-[#212121] rounded-sm h-5 w-5 flex items-center justify-center shadow-sm text-[10px]"
                  aria-label="Move up"
                  disabled={images.indexOf(img) === 0}
                >
                  <ArrowUp size={10} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveImage(img.id, "down"); }}
                  className="bg-white text-[#212121] rounded-sm h-5 w-5 flex items-center justify-center shadow-sm text-[10px]"
                  aria-label="Move down"
                  disabled={images.indexOf(img) === images.length - 1}
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
