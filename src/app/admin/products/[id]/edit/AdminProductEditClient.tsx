"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Product, Category } from "@/types";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminProductEditClient({ productId }: { productId: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [isAssured, setIsAssured] = useState(true);
  const [freeDelivery, setFreeDelivery] = useState(true);
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [prod, cats] = await Promise.all([
          adminService.getProductById(productId),
          adminService.getCategories(),
        ]);
        setCategories(cats);
        if (prod) {
          setProduct(prod);
          setTitle(prod.title);
          setBrandName(prod.brandName);
          setCategoryId(prod.categoryId);
          setPrice(prod.price);
          setOriginalPrice(prod.mrp);
          setStock(prod.stock);
          setIsAssured(prod.isAssured);
          setFreeDelivery(prod.isFreeDelivery);
          setDescription(prod.description);
          setHighlights(prod.highlights?.join(", ") || "");
          setImagePreview(prod.thumbnail || prod.images[0] || "");
        } else {
          setErrorMsg("Product not found");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load product data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [productId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !brandName.trim()) {
      setErrorMsg("Please provide title and brand.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const discountPercent = Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100));

      const highlightList = highlights
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);

      await adminService.updateProduct(productId, {
        title: title.trim(),
        brandName: brandName.trim(),
        categoryId: selectedCat?.id || categoryId,
        categorySlug: selectedCat?.slug || product?.categorySlug,
        price,
        mrp: originalPrice,
        discountPercentage: discountPercent,
        stock,
        inStock: stock > 0,
        isAssured,
        isFreeDelivery: freeDelivery,
        thumbnail: imagePreview,
        images: [imagePreview, ...(product?.images.slice(1) || [])],
        description: description.trim(),
        highlights: highlightList,
      });

      router.push("/admin/products");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-800">Product Not Found</h2>
        <p className="text-xs text-gray-500">
          The requested product SKU could not be found in active inventory.
        </p>
        <Link href="/admin/products">
          <Button size="sm" className="bg-[#2874F0] text-white text-xs">
            Back to Products Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#2874F0] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#212121]">Edit Product</h1>
              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {product.id}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Update pricing, stock availability, specifications, and imagery.
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

      {/* ── Edit Product Form ────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Image Upload & Preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Product Image
              </label>

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
                    <p className="text-xs text-gray-400">No image</p>
                  </div>
                )}
              </div>

              <label className="w-full flex items-center justify-center gap-2 h-9 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold cursor-pointer transition-colors">
                <Upload size={14} />
                <span>Change Image File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
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

          {/* Right Column: Specifications, Pricing & Stock */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-2">
                Product Details
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
                    Stock Units <span className="text-red-500">*</span>
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
                  className="text-xs"
                />
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
                {submitting ? "Saving Changes..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
