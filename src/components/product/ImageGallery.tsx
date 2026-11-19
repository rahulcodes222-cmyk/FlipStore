"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeImage = images[selectedIndex] || images[0] || "/placeholder.png";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Main Image Viewport with Interactive Zoom */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsModalOpen(true)}
        className="relative w-full aspect-square max-h-[480px] bg-white border border-[#E0E0E0] rounded-sm p-4 flex items-center justify-center overflow-hidden cursor-crosshair group"
      >
        <Image
          src={activeImage}
          alt={`${title} - view ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 550px"
          className={cn(
            "object-contain p-2 transition-transform duration-100 ease-out",
            isZooming && "scale-150 origin-[var(--zoom-x)_var(--zoom-y)]"
          )}
          style={
            {
              "--zoom-x": `${mousePos.x}%`,
              "--zoom-y": `${mousePos.y}%`,
            } as React.CSSProperties
          }
        />

        {/* Hover Zoom Hint */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs p-1.5 rounded-full shadow-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={16} />
        </div>

        {/* Mobile Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="sm:hidden absolute left-2 p-1.5 rounded-full bg-white/80 shadow-md text-gray-700"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="sm:hidden absolute right-2 p-1.5 rounded-full bg-white/80 shadow-md text-gray-700"
              aria-label="Next image"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 bg-white border rounded-xs shrink-0 p-1 transition-all cursor-pointer overflow-hidden",
                  isSelected
                    ? "border-[#2874F0] ring-2 ring-[#2874F0]/20 shadow-xs"
                    : "border-[#E0E0E0] hover:border-gray-400"
                )}
                aria-label={`View product image ${index + 1}`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal on Click */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="relative max-w-4xl w-full h-[80vh] bg-white rounded-sm p-4 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-[#212121] truncate max-w-md">{title}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-black cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative flex-1 w-full my-2">
              <Image
                src={activeImage}
                alt={title}
                fill
                sizes="(max-width: 1200px) 100vw, 1000px"
                className="object-contain"
              />
            </div>

            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      "relative w-12 h-12 border rounded-xs p-0.5",
                      selectedIndex === idx ? "border-[#2874F0] ring-1 ring-[#2874F0]" : "border-gray-200"
                    )}
                  >
                    <Image src={img} alt="Thumbnail" fill sizes="48px" className="object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
