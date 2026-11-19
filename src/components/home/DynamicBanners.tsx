"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/types";
import { MOCK_BANNERS } from "@/data/banners";
import { HeroSlider } from "@/components/home/HeroSlider";

const STORAGE_KEY = "flipstore_admin_banners_v1";

function read(): Banner[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed as Banner[];
  } catch {}
  return null;
}

export function DynamicHero({ fallback }: { fallback: Banner[] }) {
  const [banners, setBanners] = useState<Banner[]>(fallback);
  useEffect(() => {
    const stored = read();
    if (stored) setBanners(stored);
  }, []);
  const hero = banners.filter((b) => b.position === "hero" && b.isActive !== false);
  return <HeroSlider banners={hero.length ? hero : fallback} autoSlideInterval={4500} />;
}

export function DynamicPromo({ id, fallback }: { id: string; fallback: Banner }) {
  const [banner, setBanner] = useState<Banner>(fallback);
  useEffect(() => {
    const stored = read();
    if (stored) {
      const found = stored.find((b) => b.id === id) || stored.find((b) => b.position === "promo");
      if (found) setBanner(found);
    }
  }, [id]);
  // Lazy import-free render to avoid circular deps; PromoBanner is small
  const { PromoBanner } = require("@/components/home/PromoBanner");
  return <PromoBanner banner={banner} />;
}
