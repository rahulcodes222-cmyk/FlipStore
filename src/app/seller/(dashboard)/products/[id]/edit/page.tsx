"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Package,
  Tag as TagIcon,
  HelpCircle,
  FileText,
  Save,
} from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerProductService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImageUploader } from "@/components/seller/ProductImageUploader";
import { cn } from "@/lib/utils";
import { SELLER_CATEGORIES, SELLER_BRANDS } from "@/data/sellerManagement";
import type { SellerProduct } from "@/types";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  sku: z.string().min(2, "SKU is required"),
  barcode: z.string().optional(),
  category: z.string().min(1, "Select a category"),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  mrp: z.coerce.number().min(0, "MRP must be positive"),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "OUT_OF_STOCK"]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  estimatedDeliveryDays: z.coerce.number().int().min(0).max(30).optional(),
  returnPolicy: z.string().max(2000).optional(),
  returnWindowDays: z.coerce.number().int().min(0).max(365).optional(),
  isReturnable: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface VariantForm {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: string;
  mrp: string;
  stock: string;
}

interface SpecForm {
  id: string;
  key: string;
  value: string;
}

interface HighlightForm {
  id: string;
  text: string;
}

export default function SellerEditProductPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { success, error } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sellerId = (isHydrated ? seller : null)?.id || "slr-001";
  const rawId = params?.id;
  const productId = Array.isArray(rawId) ? rawId[0] : rawId;
  const isValidProductId = typeof productId === 'string' && !!productId && productId !== 'undefined' && productId !== 'null';

  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [specifications, setSpecifications] = useState<SpecForm[]>([]);
  const [highlights, setHighlights] = useState<HighlightForm[]>([]);
  const [images, setImages] = useState<{ id: string; url: string; alt?: string; isPrimary: boolean }[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      barcode: "",
      category: "",
      subcategory: "",
      brand: "",
      description: "",
      shortDescription: "",
      price: 0,
      mrp: 0,
      discountPercentage: 0,
      taxPercentage: 18,
      stock: 0,
      lowStockThreshold: 5,
      status: "DRAFT",
      seoTitle: "",
      seoDescription: "",
      estimatedDeliveryDays: 5,
      returnPolicy: "",
      returnWindowDays: 7,
      isReturnable: true,
    },
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setSubmitError("");
      if (!isValidProductId) {
        const msg = "Invalid product ID.";
        if (mounted) { setSubmitError(msg); setProduct(null); setLoading(false); error(msg); }
        return;
      }
      try {
        const p = await sellerProductService.getProduct(sellerId, productId);
        if (mounted && p) {
          setProduct(p);
          setImages(Array.isArray(p.images) ? p.images : []);
          setHighlights((p.highlights || []).map((h, i) => ({ id: `h-${i}`, text: h })));
          setVariants(
            (p.variants || []).map((v: any, i) => ({
              id: `v-${i}`,
              sku: v.sku || "",
              size: v.size || "",
              color: v.color || "",
              price: String(v.price ?? ""),
              mrp: String(v.mrp ?? ""),
              stock: String(v.stock ?? ""),
            }))
          );
          setSpecifications(
            (p.specifications || []).map((s: any, i) => ({ id: `s-${i}`, key: s.key || "", value: s.value || "" }))
          );
          form.reset({
            name: p.name || "",
            slug: p.slug || "",
            sku: p.sku || "",
            barcode: p.barcode || "",
            category: p.category || "",
            subcategory: p.subcategory || "",
            brand: p.brand || "",
            description: p.description || "",
            shortDescription: p.shortDescription || "",
            price: p.price || 0,
            mrp: p.mrp || 0,
            discountPercentage: p.discountPercentage ?? 0,
            taxPercentage: p.taxPercentage ?? 18,
            stock: p.stock ?? 0,
            lowStockThreshold: p.lowStockThreshold ?? 5,
            status: (String((p as any).approvalStatus || "") === "Pending Approval" || String((p as any).approvalStatus || "") === "Under Review") ? "PENDING_APPROVAL" : "DRAFT",
            seoTitle: p.seoTitle || "",
            seoDescription: p.seoDescription || "",
            estimatedDeliveryDays: p.estimatedDeliveryDays ?? 5,
            returnPolicy: (p as any).returnPolicy || "",
            returnWindowDays: (p as any).returnWindowDays ?? 7,
            isReturnable: (p as any).isReturnable ?? true,
          });
        }
      } catch (err: any) {
        if (mounted) {
          const msg = err?.message || "Failed to load product.";
          setSubmitError(msg);
          error(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, productId, form, error]);

  const addVariant = () =>
    setVariants([...variants, { id: `v-${Date.now()}`, sku: "", size: "", color: "", price: "", mrp: "", stock: "" }]);
  const removeVariant = (id: string) => setVariants(variants.filter((v) => v.id !== id));
  const addSpecification = () => setSpecifications([...specifications, { id: `s-${Date.now()}`, key: "", value: "" }]);
  const removeSpecification = (id: string) => setSpecifications(specifications.filter((s) => s.id !== id));
  const addHighlight = () => setHighlights([...highlights, { id: `h-${Date.now()}`, text: "" }]);
  const removeHighlight = (id: string) => setHighlights(highlights.filter((h) => h.id !== id));

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitError("");
    const validImages = images.filter((img) => {
      const url = String(img.url || "").trim();
      return /^https?:\/\//i.test(url) || /^\/uploads\//i.test(url) || /^data:image\//i.test(url);
    });
    if (validImages.length === 0) {
      const msg = "Please upload at least one product image.";
      setSubmitError(msg);
      error(msg);
      return;
    }

    const productImages = validImages.map((img, i) => ({
      id: img.id || `img-${i + 1}`,
      url: img.url,
      alt: img.alt || values.name,
      isPrimary: i === 0 ? true : !!img.isPrimary,
    }));
    if (!productImages.some((i) => i.isPrimary)) productImages[0].isPrimary = true;

    const productVariants = variants
      .map((v, i) => ({
        id: `var-${i + 1}`,
        sku: v.sku.trim(),
        size: v.size.trim() || undefined,
        color: v.color.trim() || undefined,
        price: parseFloat(v.price) || 0,
        mrp: parseFloat(v.mrp) || 0,
        stock: parseInt(v.stock, 10) || 0,
      }))
      .filter((v) => v.sku || v.size || v.color || v.price > 0 || v.stock > 0);

    const productSpecs = specifications
      .map((s) => ({ key: s.key.trim(), value: s.value.trim() }))
      .filter((s) => s.key && s.value);

    const productHighlights = highlights.map((h) => h.text.trim()).filter(Boolean);

    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim().toLowerCase(),
      sku: values.sku.trim().toUpperCase(),
      barcode: values.barcode?.trim() || undefined,
      category: values.category,
      subcategory: values.subcategory?.trim() || undefined,
      brand: values.brand?.trim() || undefined,
      description: values.description.trim(),
      shortDescription: values.shortDescription?.trim() || undefined,
      price: values.price,
      mrp: values.mrp,
      discountPercentage: values.discountPercentage ?? 0,
      taxPercentage: values.taxPercentage ?? 18,
      stock: values.stock,
      lowStockThreshold: values.lowStockThreshold ?? 5,
      status: values.status,
      seoTitle: values.seoTitle?.trim() || undefined,
      seoDescription: values.seoDescription?.trim() || undefined,
      estimatedDeliveryDays: values.estimatedDeliveryDays ?? 5,
      returnPolicy: values.returnPolicy || "",
      returnWindowDays: Number(values.returnWindowDays ?? 7),
      isReturnable: values.isReturnable ?? true,
      images: productImages,
      variants: productVariants,
      specifications: productSpecs,
      highlights: productHighlights,
    };

    setIsSaving(true);
    try {
      await sellerProductService.updateProduct(sellerId, productId, payload);
      success(values.status === "PENDING_APPROVAL" ? "Product submitted for approval." : "Product changes saved as draft.");
      router.push("/seller/products");
    } catch (err: any) {
      const msg = err?.message || "Failed to update product.";
      setSubmitError(msg);
      error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = () => {
    const msg = "Please fix the highlighted fields before saving.";
    setSubmitError(msg);
    error(msg);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-lg font-bold text-[#212121]">Edit Product</h1>
        <div className="h-40 rounded-sm bg-[#E8E8E8] animate-skeleton mt-4" />
      </div>
    );
  }

  if (!isValidProductId || !product) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <h1 className="text-lg font-bold text-[#212121]">Edit Product</h1>
        <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError || "Product not found."}</div>
        <Link href="/seller/products" className="inline-flex items-center gap-2 text-sm text-[#2874F0] font-semibold hover:underline"><ArrowLeft size={16} /> Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/seller/products" className="inline-flex items-center gap-2 text-sm text-[#2874F0] font-semibold hover:underline">
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[#212121]">Edit Product</h1>
          {(() => {
            const st = String((product as any).approvalStatus || "Draft");
            const ps = String((product as any).productStatus || "Inactive");
            const label = st === "Approved" && ps === "Active" ? "Active" : st === "Approved" ? "Approved" : st;
            const cls = st === "Approved" ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]" : st === "Rejected" ? "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]" : st === "Changes Requested" ? "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]" : st === "Pending Approval" || st === "Under Review" ? "bg-[#FFF8E1] text-[#B26A00] border-[#FFE082]" : "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]";
            return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border", cls)}>{label}</span>;
          })()}
        </div>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Edit {product.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {((product as any)?.rejectionReason || (product as any)?.adminComment) && (
            <div className={cn("rounded-sm border px-3 py-2 text-sm", String((product as any).approvalStatus) === "Rejected" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800")}>
              <p className="font-semibold text-xs mb-0.5">{String((product as any).approvalStatus) === "Rejected" ? "Rejection Feedback" : "Requested Changes / Admin Comment"}</p>
              <p>{String((product as any).rejectionReason || (product as any).adminComment)}</p>
            </div>
          )}
          <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2"><Package size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Basic Information</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Product Name</label><Input {...form.register("name")} />{form.formState.errors.name && <p className="text-[10px] text-[#E53935]">{form.formState.errors.name.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Product Slug</label><Input {...form.register("slug")} />{form.formState.errors.slug && <p className="text-[10px] text-[#E53935]">{form.formState.errors.slug.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">SKU</label><Input {...form.register("sku")} />{form.formState.errors.sku && <p className="text-[10px] text-[#E53935]">{form.formState.errors.sku.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Barcode</label><Input {...form.register("barcode")} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Category</label><select {...form.register("category")} className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"><option value="">Select category</option>{SELLER_CATEGORIES.map((c: string) => <option key={c} value={c}>{c}</option>)}</select>{form.formState.errors.category && <p className="text-[10px] text-[#E53935]">{form.formState.errors.category.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Subcategory</label><Input {...form.register("subcategory")} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Brand</label><select {...form.register("brand")} className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"><option value="">Select brand</option>{SELLER_BRANDS.map((b: string) => <option key={b} value={b}>{b}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Estimated Delivery (days)</label><Input type="number" min={0} max={30} {...form.register("estimatedDeliveryDays")} /></div>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Description</label><Textarea {...form.register("description")} rows={4} />{form.formState.errors.description && <p className="text-[10px] text-[#E53935]">{form.formState.errors.description.message}</p>}</div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Short Description</label><Input {...form.register("shortDescription")} /></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Highlights</label><div className="space-y-2">{highlights.map((h) => <div key={h.id} className="flex gap-2"><Input value={h.text} onChange={(e) => setHighlights((prev) => prev.map((x) => x.id === h.id ? { ...x, text: e.target.value } : x))} /><button type="button" onClick={() => removeHighlight(h.id)} className="p-1 text-[#878787] hover:text-[#E53935]"><Trash2 size={14} /></button></div>)}<Button type="button" variant="outline" size="sm" onClick={addHighlight} className="w-auto"><Plus size={14} /> Add Highlight</Button></div></div>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2"><TagIcon size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Pricing</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Selling Price (?)</label><Input type="number" min={0} {...form.register("price")} />{form.formState.errors.price && <p className="text-[10px] text-[#E53935]">{form.formState.errors.price.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">MRP (?)</label><Input type="number" min={0} {...form.register("mrp")} />{form.formState.errors.mrp && <p className="text-[10px] text-[#E53935]">{form.formState.errors.mrp.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Discount %</label><Input type="number" min={0} max={100} {...form.register("discountPercentage")} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Tax %</label><Input type="number" min={0} max={100} {...form.register("taxPercentage")} /></div>
              </div>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2"><Package size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Inventory</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Stock Quantity</label><Input type="number" min={0} {...form.register("stock")} />{form.formState.errors.stock && <p className="text-[10px] text-[#E53935]">{form.formState.errors.stock.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Low Stock Threshold</label><Input type="number" min={0} {...form.register("lowStockThreshold")} /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Submission Status</label>
                <select {...form.register("status")} className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]">
                  <option value="DRAFT">Save as Draft</option>
                  <option value="PENDING_APPROVAL">Submit for Approval</option>
                </select>
                <p className="text-[10px] text-[#878787]">Approved products edited by seller require re-approval before being visible again.</p>
              </div>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2"><Plus size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Product Images</h3></div>
              <ProductImageUploader images={images} onChange={setImages} maxImages={5} />
              <p className="text-xs text-[#878787]">Upload at least one image. The first image is the primary image.</p>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><TagIcon size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Product Variants</h3></div><Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus size={14} /> Add Variant</Button></div>
              <div className="space-y-3">
                {variants.map((v) => (
                  <div key={v.id} className="border border-[#E0E0E0] rounded-sm p-3 space-y-3">
                    <div className="flex justify-end"><button type="button" onClick={() => removeVariant(v.id)} className="p-1 text-[#878787] hover:text-[#E53935]"><Trash2 size={16} /></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">SKU</label><Input value={v.sku} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, sku: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Size</label><Input value={v.size} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, size: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Color</label><Input value={v.color} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, color: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Price (?)</label><Input value={v.price} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, price: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">MRP (?)</label><Input value={v.mrp} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, mrp: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Stock</label><Input value={v.stock} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, stock: e.target.value } : x))} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><FileText size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Specifications</h3></div><Button type="button" variant="outline" size="sm" onClick={addSpecification}><Plus size={14} /> Add Spec</Button></div>
              <div className="space-y-3">
                {specifications.map((s) => (
                  <div key={s.id} className="border border-[#E0E0E0] rounded-sm p-3 space-y-2">
                    <div className="flex justify-end"><button type="button" onClick={() => removeSpecification(s.id)} className="p-1 text-[#878787] hover:text-[#E53935]"><Trash2 size={16} /></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Key</label><Input value={s.key} onChange={(e) => setSpecifications((prev) => prev.map((x) => x.id === s.id ? { ...x, key: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Value</label><Input value={s.value} onChange={(e) => setSpecifications((prev) => prev.map((x) => x.id === s.id ? { ...x, value: e.target.value } : x))} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2"><HelpCircle size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">SEO</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">SEO Title</label><Input {...form.register("seoTitle")} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">SEO Description</label><Textarea {...form.register("seoDescription")} rows={2} /></div>
              </div>
            </section>

            {submitError && <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>}

            <div className="flex gap-3 pt-6 border-t border-[#F0F0F0]">
              <Button type="button" variant="outline" onClick={() => router.push("/seller/products")}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={isSaving}><Save size={16} /> Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

