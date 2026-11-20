"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Package,
} from "lucide-react";
import { Category } from "@/types";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
];

export function AdminProductAddClient() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState<number>(999);
  const [originalPrice, setOriginalPrice] = useState<number>(1499);
  const [stock, setStock] = useState<number>(25);
  const [isAssured, setIsAssured] = useState(true);
  const [freeDelivery, setFreeDelivery] = useState(true);
  const [returnPolicy, setReturnPolicy] = useState("7-day easy return policy. Items must be unused, in original packaging with all tags intact.");
  const [returnWindowDays, setReturnWindowDays] = useState(7);
  const [isReturnable, setIsReturnable] = useState(true);
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("High durability, Premium finish, 1 Year Manufacturer Warranty");
  const [imagePreview, setImagePreview] = useState<string>(SAMPLE_IMAGES[0]);

  useEffect(() => {
    adminService.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
    });
  }, []);

  // Handle local file upload with FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !brandName.trim()) {
      setErrorMsg("Please enter both product title and brand name.");
      return;
    }

    if (price <= 0 || originalPrice <= 0) {
      setErrorMsg("Please specify valid prices.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedCat = categories.find((c) => c.id === categoryId) || categories[0];
      const discountPercent = Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100));

      const highlightList = highlights
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);

      await adminService.createProduct({
        title: title.trim(),
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        brandId: brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        brandName: brandName.trim(),
        categoryId: selectedCat?.id || "mobiles",
        categoryName: selectedCat?.name || "Mobiles",
        categorySlug: selectedCat?.slug || "mobiles",
        price,
        mrp: originalPrice,
        discountPercentage: discountPercent,
        inStock: stock > 0,
        stock,
        rating: 4.3,
        ratingCount: 1,
        reviewCount: 1,
        isAssured,
        isFreeDelivery: freeDelivery,
        estimatedDeliveryDays: 2,
        returnPolicy,
        returnWindowDays,
        isReturnable,
        seller: {
          id: "seller-1",
          name: "RetailNet Official",
          rating: 4.8,
        },
        thumbnail: imagePreview,
        images: [imagePreview],
        shortDescription: `${title} by ${brandName}`,
        description: description.trim() || `${title} from ${brandName}. Experience ultimate quality and reliable performance.`,
        highlights: highlightList.length > 0 ? highlightList : ["Premium quality product", "Official warranty included"],
        specifications: {
          General: {
            Brand: brandName,
            Model: title,
          },
        },
        tags: [selectedCat?.slug || "general", brandName.toLowerCase()],
      } as any);

      router.push("/admin/products");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Breadcrumb & Title ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#2874F0] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#212121]">Add New Product</h1>
            <p className="text-xs text-gray-500">
              Create a new item in your catalog with local image preview and inventory tracking.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Add Product Form ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Image Upload & Preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Product Image
              </label>

              {/* Preview Box */}
              <div className="relative aspect-square w-full bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">No image selected</p>
                  </div>
                )}
              </div>

              {/* Local File Upload Button */}
              <div className="space-y-2">
                <label className="w-full flex items-center justify-center gap-2 h-9 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold cursor-pointer transition-colors">
                  <Upload size={14} />
                  <span>Upload Local Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-gray-400 text-center">
                  Supports PNG, JPG, or WEBP up to 5MB (via local FileReader)
                </p>
              </div>

              {/* Sample Preset Images */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-[11px] font-semibold text-gray-500 block mb-2">
                  Or pick a preset sample:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {SAMPLE_IMAGES.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImagePreview(url)}
                      className={`relative aspect-square rounded border overflow-hidden ${
                        imagePreview === url ? "ring-2 ring-[#2874F0] border-transparent" : "border-gray-200"
                      }`}
                    >
                      <Image src={url} alt={`sample ${i}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Badges & Logistics */}
            <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Badges &amp; Logistics
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={isAssured}
                  onChange={(e) => setIsAssured(e.target.checked)}
                  className="rounded text-[#2874F0] focus:ring-[#2874F0] w-4 h-4"
                />
                <span>FlipStore Assured Quality</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={freeDelivery}
                  onChange={(e) => setFreeDelivery(e.target.checked)}
                  className="rounded text-[#2874F0] focus:ring-[#2874F0] w-4 h-4"
                />
                <span>Eligible for Free Delivery</span>
              </label>
            </div>
          </div>

          {/* Right Column: Specifications, Pricing & Stock (2 columns) */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-2">
                Basic Information
              </h2>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Apple iPhone 15 (128 GB) - Black"
                  className="h-9 text-xs"
                />
              </div>

              {/* Brand & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Apple, Samsung, Nike"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded text-gray-800 font-semibold focus:outline-none focus:border-[#2874F0]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    MRP Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Initial Stock Units <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Key Highlights (comma-separated)
                </label>
                <Input
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  placeholder="Feature 1, Feature 2, Warranty period"
                  className="h-9 text-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Description
                </label>
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Provide detailed description of the product, design, features, and specs..."
                  className="text-xs"
                />
              </div>
            </div>

            {/* Return Policy */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#F0F0F0]">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Return Policy
                </label>
                <Textarea
                  rows={3}
                  value={returnPolicy}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReturnPolicy(e.target.value)}
                  placeholder="e.g. 7-day return, unused items only, original packaging required"
                  className="text-xs"
                />
              </div>
              <div className="flex items-end">
                <label className="block text-xs font-semibold text-gray-700 mb-1 hidden sm:block">
                  Return Window (days)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={365}
                  value={returnWindowDays}
                  onChange={(e) => setReturnWindowDays(Number(e.target.value))}
                  className="h-9 text-xs w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isReturnable}
                  onChange={(e) => setIsReturnable(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E0E0E0] text-[#2874F0] focus:ring-[#2874F0]"
                />
                <label className="text-xs text-[#212121]">Allow returns</label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Link href="/admin/products">
                <Button variant="outline" type="button" className="h-9 text-xs font-semibold bg-white">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white px-6"
              >
                {submitting ? "Publishing Product..." : "Save & Publish Product"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
