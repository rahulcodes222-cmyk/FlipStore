"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, ChevronDown, X, Navigation, LocateFixed, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeliveryLocationStore, getDeliveryLocationLabel } from "@/store/useDeliveryLocationStore";
import { useHydration } from "@/hooks/useHydration";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { useToast } from "@/components/common/Toast";

export function DeliveryLocationSelector({ compact = false }: { compact?: boolean }) {
  const isHydrated = useHydration();
  const { toast } = useToast();
  const { location, setLocation, clearLocation } = useDeliveryLocationStore();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [stateName, setStateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const current = isHydrated ? location : null;
  const label = getDeliveryLocationLabel(current);

  useEffect(() => {
    if (open) {
      setPincode(current?.pincode || "");
      setCity(current?.city || current?.area || "");
      setArea(current?.area || "");
      setStateName(current?.state || "");
      setError(null);
    }
  }, [open, current]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
    }
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const canApply = useMemo(() => /^\d{6}$/.test(pincode.trim()), [pincode]);

  async function reverseGeocode(lat: number, lon: number) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error("Failed to detect address from location.");
    const data = await res.json();
    const addr = data?.address || {};
    const detectedPincode = String(addr.postcode || "").replace(/\D/g, "").slice(0, 6);
    const detectedCity = String(addr.city || addr.town || addr.village || addr.hamlet || addr.county || "").trim();
    const detectedArea = String(addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.road || "").trim();
    const detectedState = String(addr.state || "").trim();
    return { pincode: detectedPincode, city: detectedCity, area: detectedArea, state: detectedState };
  }

  const persistLocationAsDeliveryAddress = async (loc: { pincode: string; city?: string; area?: string; state?: string }, opts?: { silent?: boolean; closeOnSuccess?: boolean }) => {
    const pin = String(loc.pincode || "").trim();
    if (!/^\d{6}$/.test(pin)) { if (!opts?.silent) setError("Enter a valid 6-digit pincode before saving."); return false; }
    if (!isAuthenticated || !user) { if (!opts?.silent) setError("Sign in to save this location to your delivery address."); return false; }
    setIsSavingAddress(true);
    setError(null);
    try {
      const c = (loc.city || loc.area || "Detected location").trim();
      const a = (loc.area || loc.city || "Detected location").trim();
      const s = (loc.state || "Unknown").trim();
      const locality = a || c || "Detected location";
      const street = `${locality}, Current location (auto-detected)`;
      const addresses = await authService.getAddresses().catch(() => [] as any[]);
      const existing = (addresses || []).find((addr: any) =>
        String(addr?.pincode || "").trim() === pin &&
        String(addr?.city || "").trim().toLowerCase() === c.toLowerCase()
      );
      let targetId = existing?.id;
      if (existing) {
        const updated = await authService.editAddress(existing.id, {
          name: existing.name || user.name || "Customer",
          phone: existing.phone || user.phone || "9999999999",
          pincode: pin,
          locality,
          street: existing.street || street,
          city: c,
          state: s,
          type: existing.type || "home",
        });
        targetId = updated?.id || existing.id;
      } else {
        const created = await authService.addAddress({
          name: user.name || "Customer",
          phone: user.phone || "9999999999",
          pincode: pin,
          locality,
          street,
          city: c,
          state: s,
          type: "home",
          isDefault: (addresses || []).length === 0,
        } as any);
        targetId = created?.id;
      }
      if (targetId) {
        await authService.setDefaultAddress(targetId).catch(() => undefined);
      }
      const updatedAddresses = await authService.getAddresses().catch(() => addresses || []);
      const defaultAddr = (updatedAddresses || []).find((ad: any) => ad.isDefault) || (updatedAddresses || [])[0];
      updateUser({ addresses: updatedAddresses, defaultAddressId: defaultAddr?.id } as any);
      setLocation({ pincode: pin, city: c || undefined, area: a || undefined, state: s || undefined });
      toast({ type: "success", title: "Delivery address updated", message: `${pin}${c ? `, ${c}` : ""} saved as your default delivery address.` });
      if (opts?.closeOnSuccess) setOpen(false);
      return true;
    } catch (e: any) {
      if (!opts?.silent) setError(e?.message || "Failed to save location to delivery address.");
      return false;
    } finally {
      setIsSavingAddress(false);
    }
  };

  const detectCurrentLocation = async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (typeof window === "undefined" || !navigator.geolocation) {
      if (!silent) setError("Geolocation is not supported in this browser.");
      return;
    }
    setIsDetecting(true);
    if (!silent) setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        })
      );
      const detected = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (!/^\d{6}$/.test(detected.pincode)) {
        throw new Error("Could not detect a valid 6-digit pincode for this location. Please enter it manually.");
      }
      const loc = {
        pincode: detected.pincode,
        city: detected.city || detected.area || undefined,
        area: detected.area || detected.city || undefined,
        state: detected.state || undefined,
      };
      setPincode(detected.pincode);
      setCity(detected.city || detected.area || "");
      setArea(detected.area || detected.city || "");
      setStateName(detected.state || "");
      setLocation(loc);
      if (isAuthenticated && user) {
        await persistLocationAsDeliveryAddress(loc, { silent: true, closeOnSuccess: false });
      } else if (!silent) {
        toast({ type: "success", title: "Location detected", message: `${detected.pincode}${detected.city ? `, ${detected.city}` : ""}` });
      }
    } catch (e: any) {
      if (!silent) {
        const msg = e?.code === 1
          ? "Location permission denied. Please allow location access or enter pincode manually."
          : e?.code === 2
            ? "Location unavailable. Please try again or enter pincode manually."
            : e?.code === 3
              ? "Location request timed out. Please try again."
              : (e?.message || "Failed to detect current location.");
        setError(msg);
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const autoDetectAttempted = useRef(false);
  useEffect(() => {
    if (!isHydrated || autoDetectAttempted.current) return;
    if (current?.pincode) {
      autoDetectAttempted.current = true;
      return;
    }
    autoDetectAttempted.current = true;
    void detectCurrentLocation({ silent: true });
  }, [isHydrated, current?.pincode]);

  const apply = async () => {
    const pin = pincode.trim();
    if (!/^\d{6}$/.test(pin)) { setError("Enter a valid 6-digit pincode"); return; }
    const c = city.trim();
    const a = area.trim() || c;
    const s = stateName.trim();
    const loc = {
      pincode: pin,
      city: c || a || undefined,
      area: a || c || undefined,
      state: s || undefined,
    };
    setLocation(loc);
    if (isAuthenticated && user) {
      await persistLocationAsDeliveryAddress(loc, { closeOnSuccess: true });
    } else {
      setOpen(false);
    }
  };

  const saveLocationToDeliveryAddress = async () => {
    await persistLocationAsDeliveryAddress(
      { pincode: pincode.trim(), city: city.trim(), area: area.trim(), state: stateName.trim() },
      { closeOnSuccess: true }
    );
  };

  return (
    <div className={cn("relative", compact ? "" : "min-w-0")} ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 text-white hover:bg-white/10 rounded-xs transition-colors text-left",
          compact ? "px-2 py-1.5" : "px-2 py-1.5 sm:px-2.5"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={label}
      >
        <MapPin size={16} className="text-[#ffe500] shrink-0" />
        <span className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] text-white/80 hidden sm:block">Deliver to</span>
          <span className={cn("font-semibold truncate", compact ? "text-[11px] max-w-[110px] sm:max-w-[140px]" : "text-[11px] sm:text-xs max-w-[120px] sm:max-w-[170px]")}>
            {isHydrated ? (current ? label : "Select location") : "Select location"}
          </span>
        </span>
        <ChevronDown size={14} className={cn("shrink-0 text-white/80 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[300px] sm:w-[340px] bg-white rounded-sm shadow-2xl border border-[#E0E0E0] z-50 overflow-hidden text-[#212121]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0] bg-[#F9FAFB]">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-[#2874F0]" />
              <span className="text-sm font-bold">Choose your delivery location</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-200 text-[#616161]" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-[#616161]">Enter your pincode or use current location to see product availability and delivery options.</p>
            <button
              type="button"
              onClick={() => void detectCurrentLocation()}
              disabled={isDetecting}
              className={cn(
                "w-full h-10 rounded-xs text-sm font-semibold border transition-colors flex items-center justify-center gap-2",
                isDetecting ? "bg-[#F5F5F5] text-[#9E9E9E] border-[#E0E0E0]" : "bg-blue-50 text-[#2874F0] border-blue-200 hover:bg-blue-100"
              )}
            >
              <LocateFixed size={15} />
              {isDetecting ? "Detecting location..." : "Use current location"}
            </button>
            <div>
              <label className="block text-xs font-semibold text-[#424242] mb-1">Pincode</label>
              <input
                value={pincode}
                onChange={(e) => { setPincode(e.target.value.replace(/[^\d]/g, "").slice(0, 6)); setError(null); }}
                placeholder="Enter 6-digit pincode"
                inputMode="numeric"
                className="w-full h-10 px-3 border border-[#D0D0D0] rounded-xs text-sm focus:outline-none focus:border-[#2874F0]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#424242] mb-1">City / Area (optional)</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value.slice(0, 60))}
                placeholder="e.g. New Delhi"
                className="w-full h-10 px-3 border border-[#D0D0D0] rounded-xs text-sm focus:outline-none focus:border-[#2874F0]"
              />
            </div>
            {(area || stateName) && (
              <div className="text-[11px] text-[#616161] bg-[#F9FAFB] border border-[#EAEAEA] rounded-xs px-2.5 py-2">
                {area ? <div><span className="font-semibold text-[#424242]">Area:</span> {area}</div> : null}
                {stateName ? <div><span className="font-semibold text-[#424242]">State:</span> {stateName}</div> : null}
              </div>
            )}
            {error ? <p className="text-xs text-[#D32F2F]">{error}</p> : null}
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={() => void apply()} disabled={!canApply || isSavingAddress} className={cn("flex-1 h-10 rounded-xs text-sm font-bold text-white transition-colors", canApply && !isSavingAddress ? "bg-[#FB641B] hover:bg-[#e65a17]" : "bg-[#F0F0F0] text-[#9E9E9E] cursor-not-allowed")}>{isAuthenticated && isSavingAddress ? "Saving..." : "Apply"}</button>
              {current ? (
                <button type="button" onClick={() => { clearLocation(); setOpen(false); }} className="h-10 px-3 rounded-xs text-sm font-semibold border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F5F5]">Clear</button>
              ) : null}
            </div>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => void saveLocationToDeliveryAddress()}
                disabled={!canApply || isSavingAddress}
                className={cn(
                  "w-full h-10 rounded-xs text-sm font-semibold border flex items-center justify-center gap-2 transition-colors",
                  canApply && !isSavingAddress
                    ? "border-[#2874F0] text-[#2874F0] bg-white hover:bg-blue-50"
                    : "border-[#E0E0E0] text-[#9E9E9E] bg-[#F5F5F5] cursor-not-allowed"
                )}
              >
                <Save size={14} />
                {isSavingAddress ? "Saving to delivery address..." : "Save as default delivery address"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
