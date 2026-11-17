"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Upload, Store, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Seller } from "@/types";
import { cn } from "@/lib/utils";

const storeSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeSlug: z
    .string()
    .min(2, "Store URL must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  storeDescription: z.string().max(500, "Description too long").optional().or(z.literal("")),
  businessCategory: z.string().optional().or(z.literal("")),
  businessEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  businessPhone: z.string().min(10, "Enter a valid phone number").optional().or(z.literal("")),
});

export type StoreFormValues = z.infer<typeof storeSchema>;

interface StoreProfileFormProps {
  seller: Seller | null;
  onUpdate: (data: StoreFormValues & { storeLogo?: string; storeBanner?: string; logoUrl?: string; bannerUrl?: string; description?: string }) => Promise<void> | void;
  onUploadImage?: (file: File) => Promise<string>;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
}

export function StoreProfileForm({ seller, onUpdate, onUploadImage, onCancel, submitLabel = "Save Changes", className }: StoreProfileFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(seller?.storeLogo || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(seller?.storeBanner || null);
  const [logoUrl, setLogoUrl] = useState<string>(seller?.storeLogo || "");
  const [bannerUrl, setBannerUrl] = useState<string>(seller?.storeBanner || "");
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
  const [error, setError] = useState("");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      storeName: seller?.storeName || "",
      storeSlug: seller?.storeSlug || "",
      storeDescription: seller?.storeDescription || "",
      businessCategory: seller?.businessCategory || "",
      businessEmail: seller?.businessEmail || "",
      businessPhone: seller?.businessPhone || "",
    },
  });

  useEffect(() => {
    setLogoPreview(seller?.storeLogo || null);
    setBannerPreview(seller?.storeBanner || null);
    setLogoUrl(seller?.storeLogo || "");
    setBannerUrl(seller?.storeBanner || "");
    form.reset({
      storeName: seller?.storeName || "",
      storeSlug: seller?.storeSlug || "",
      storeDescription: seller?.storeDescription || "",
      businessCategory: seller?.businessCategory || "",
      businessEmail: seller?.businessEmail || "",
      businessPhone: seller?.businessPhone || "",
    });
  }, [seller, form]);

  const handleImage = async (type: "logo" | "banner", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const localUrl = URL.createObjectURL(file);
    if (type === "logo") setLogoPreview(localUrl);
    else setBannerPreview(localUrl);

    if (onUploadImage) {
      setUploading(type);
      try {
        const uploaded = await onUploadImage(file);
        if (type === "logo") {
          setLogoUrl(uploaded);
          setLogoPreview(uploaded);
        } else {
          setBannerUrl(uploaded);
          setBannerPreview(uploaded);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to upload image.");
      } finally {
        setUploading(null);
      }
    }
    e.target.value = "";
  };

  const onSubmit = async (values: StoreFormValues) => {
    setIsSaving(true);
    setError("");
    try {
      await onUpdate({
        ...values,
        storeDescription: values.storeDescription ?? "",
        description: values.storeDescription ?? "",
        storeLogo: logoUrl || logoPreview || undefined,
        storeBanner: bannerUrl || bannerPreview || undefined,
        logoUrl: logoUrl || logoPreview || undefined,
        bannerUrl: bannerUrl || bannerPreview || undefined,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to save store profile.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Store Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1 space-y-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#E0E0E0] bg-[#F9FAFB] overflow-hidden relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Store logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Upload size={20} className="text-[#878787]" /></div>
                    )}
                    <input ref={logoInputRef} id="logo-input" type="file" accept="image/*" onChange={(e) => handleImage("logo", e)} className="sr-only" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="flex items-center gap-1 text-xs text-white font-medium">
                        <Upload size={12} /> {uploading === "logo" ? "Uploading..." : "Change"}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="text-[11px] font-medium text-[#2874F0] hover:underline">
                    Upload Store Logo
                  </button>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-24 rounded-sm border-2 border-dashed border-[#E0E0E0] bg-[#F9FAFB] overflow-hidden relative group">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Store banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-[#878787]" /></div>
                    )}
                    <input ref={bannerInputRef} id="banner-input" type="file" accept="image/*" onChange={(e) => handleImage("banner", e)} className="sr-only" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => bannerInputRef.current?.click()} className="flex items-center gap-1 text-xs text-white font-medium">
                        <Upload size={12} /> {uploading === "banner" ? "Uploading..." : "Change"}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => bannerInputRef.current?.click()} className="text-[11px] font-medium text-[#2874F0] hover:underline">
                    Upload Store Banner
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Store Name</label>
                    <Input {...form.register("storeName")} placeholder="e.g. ElectroHub India" />
                    {form.formState.errors.storeName && <p className="text-[10px] text-[#E53935]">{form.formState.errors.storeName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Store URL / Slug</label>
                    <Input {...form.register("storeSlug")} placeholder="e.g. electrohub-india" />
                    {form.formState.errors.storeSlug && <p className="text-[10px] text-[#E53935]">{form.formState.errors.storeSlug.message}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Store Description</label>
                    <Textarea {...form.register("storeDescription")} rows={4} placeholder="Describe your store..." />
                    {form.formState.errors.storeDescription && <p className="text-[10px] text-[#E53935]">{form.formState.errors.storeDescription.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Category</label>
                    <Input {...form.register("businessCategory")} placeholder="e.g. Electronics" />
                    {form.formState.errors.businessCategory && <p className="text-[10px] text-[#E53935]">{form.formState.errors.businessCategory.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Contact Email</label>
                    <Input {...form.register("businessEmail")} type="email" />
                    {form.formState.errors.businessEmail && <p className="text-[10px] text-[#E53935]">{form.formState.errors.businessEmail.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Contact Phone</label>
                    <Input {...form.register("businessPhone")} placeholder="+91 98765 43210" />
                    {form.formState.errors.businessPhone && <p className="text-[10px] text-[#E53935]">{form.formState.errors.businessPhone.message}</p>}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-[#878787]">
                  <Store size={14} />
                  <span>
                    Store preview: <span className="text-[#2874F0] font-medium">flipstore.in/seller/{form.watch("storeSlug") || seller?.storeSlug || "your-store"}</span>
                  </span>
                </div>

                {error && <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

                <div className="flex gap-2">
                  {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="w-auto">
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" variant="primary" isLoading={isSaving || uploading !== null} leftIcon={<Save size={16} />} className="w-auto">
                    {submitLabel}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
