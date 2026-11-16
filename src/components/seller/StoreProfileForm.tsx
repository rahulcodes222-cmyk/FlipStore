"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import {
  Save,
  Upload,
  Store,
  Image as ImageIcon,
  Link as LinkIcon,
  Mail,
  Phone,
  MapPin,
  RefreshCcw,
} from "lucide-react";
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
  storeDescription: z.string().max(500, "Description too long"),
  businessCategory: z.string().min(1, "Please select a category"),
  businessEmail: z.string().email("Invalid email address"),
  businessPhone: z.string().min(10, "Enter a valid phone number"),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface StoreProfileFormProps {
  seller: Seller | null;
  onUpdate: (data: StoreFormValues) => void;
  className?: string;
}

export function StoreProfileForm({ seller, onUpdate, className }: StoreProfileFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const onSubmit = async (values: StoreFormValues) => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    onUpdate(values);
    setIsSaving(false);
  };

  const handleImage = (type: "logo" | "banner", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "logo") setLogoPreview(url);
    else setBannerPreview(url);
  };

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Store Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Store Images */}
              <div className="lg:col-span-1 space-y-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#E0E0E0] bg-[#F9FAFB] overflow-hidden relative">
                    {logoPreview || seller?.storeLogo ? (
                      <img
                        src={logoPreview || seller?.storeLogo}
                        alt="Store logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload size={20} className="text-[#878787]" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImage("logo", e)}
                      className="sr-only"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => (document.getElementById("logo-input") as HTMLInputElement).click()}
                        className="flex items-center gap-1 text-xs text-white font-medium"
                      >
                        <Upload size={12} /> Change
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => (document.getElementById("logo-input") as HTMLInputElement).click()}
                    className="text-[11px] font-medium text-[#2874F0] hover:underline"
                  >
                    Upload Store Logo
                  </button>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-24 rounded-sm border-2 border-dashed border-[#E0E0E0] bg-[#F9FAFB] overflow-hidden relative">
                    {bannerPreview || seller?.storeBanner ? (
                      <img
                        src={bannerPreview || seller?.storeBanner}
                        alt="Store banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={20} className="text-[#878787]" />
                    )}
                    <input
                      id="banner-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImage("banner", e)}
                      className="sr-only"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => (document.getElementById("banner-input") as HTMLInputElement).click()}
                        className="flex items-center gap-1 text-xs text-white font-medium"
                      >
                        <Upload size={12} /> Change
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => (document.getElementById("banner-input") as HTMLInputElement).click()}
                    className="text-[11px] font-medium text-[#2874F0] hover:underline"
                  >
                    Upload Store Banner
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">
                      Store Name
                    </label>
                    <Input
                      {...form.register("storeName")}
                      placeholder="e.g. ElectroHub India"
                    />
                    {form.formState.errors.storeName && (
                      <p className="text-[10px] text-[#E53935]">{form.formState.errors.storeName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">
                      Store URL / Slug
                    </label>
                    <Input
                      {...form.register("storeSlug")}
                      placeholder="e.g. electrohub-india"
                    />
                    {form.formState.errors.storeSlug && (
                      <p className="text-[10px] text-[#E53935]">{form.formState.errors.storeSlug.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">
                      Store Description
                    </label>
                    <Textarea
                      {...form.register("storeDescription")}
                      rows={3}
                      placeholder="Describe your store..."
                    />
                    {form.formState.errors.storeDescription && (
                      <p className="text-[10px] text-[#E53935]">{form.formState.errors.storeDescription.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">
                      Business Category
                    </label>
                    <Input
                      {...form.register("businessCategory")}
                      placeholder="e.g. Electronics"
                    />
                    {form.formState.errors.businessCategory && (
                      <p className="text-[10px] text-[#E53935]">{form.formState.errors.businessCategory.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">
                      Contact Email
                    </label>
                    <Input {...form.register("businessEmail")} type="email" />
                    {form.formState.errors.businessEmail && (
                      <p className="text-[10px] text-[#E53935]">{form.formState.errors.businessEmail.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">
                      Contact Phone
                    </label>
                    <Input {...form.register("businessPhone")} placeholder="+91 98765 43210" />
                    {form.formState.errors.businessPhone && (
                      <p className="text-[10px] text-[#E53935]">{form.formState.errors.businessPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-[#878787]">
                  <Store size={14} />
                  <span>
                    Store preview: <span className="text-[#2874F0] font-medium">flipstore.in/seller/{form.watch("storeSlug") || seller?.storeSlug}</span>
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                  leftIcon={<Save size={16} />}
                  className="w-auto"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
