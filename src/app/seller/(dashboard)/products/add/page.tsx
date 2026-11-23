"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, ArrowLeft, Package, Tag as TagIcon, HelpCircle, FileText, Save } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerProductService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImageUploader } from "@/components/seller/ProductImageUploader";
import { SELLER_BRANDS, SELLER_CATEGORIES } from "@/data/sellerManagement";
import { categoryService } from "@/services/categoryService";

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
  weight: z.coerce.number().min(0, "Weight must be positive").optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "OUT_OF_STOCK"]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  estimatedDeliveryDays: z.coerce.number().int().min(0).max(30).optional(),
  isFreeDelivery: z.boolean().optional(),
  returnPolicy: z.string().optional(),
  returnWindowDays: z.coerce.number().int().min(0).max(365).optional(),
  isReturnable: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface VariantForm { id: string; sku: string; size: string; color: string; price: string; mrp: string; stock: string; }
interface SpecForm { id: string; key: string; value: string; }
interface HighlightForm { id: string; text: string; }

function slugify(v: string) {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

export default function SellerAddProductPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { success, error } = useToast();
  const router = useRouter();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "";

  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [specifications, setSpecifications] = useState<SpecForm[]>([{ id: "s-1", key: "", value: "" }]);
  const [highlights, setHighlights] = useState<HighlightForm[]>([{ id: "h-1", text: "" }]);
  const [images, setImages] = useState<{ id: string; url: string; alt?: string; isPrimary: boolean }[]>([]);
  const [customBrand, setCustomBrand] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>(SELLER_CATEGORIES);

  useEffect(() => {
    let mounted = true;
    categoryService.getCategories()
      .then((cats) => {
        if (!mounted) return;
        const names = Array.from(new Set((cats || []).map((c) => c?.name).filter(Boolean) as string[]));
        if (names.length) setCategoryOptions(names);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

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
      price: undefined as any,
      mrp: undefined as any,
      discountPercentage: undefined as any,
      taxPercentage: undefined as any,
      stock: undefined as any,
      weight: undefined as any,
      lowStockThreshold: undefined as any,
      status: "DRAFT",
      seoTitle: "",
      seoDescription: "",
      estimatedDeliveryDays: 3,
      isFreeDelivery: false,
      returnPolicy: "",
      returnWindowDays: 7,
      isReturnable: true,
    },
  });

  const watchName = form.watch("name");
  useMemo(() => {
    if (!form.getValues("slug") && watchName) form.setValue("slug", slugify(watchName), { shouldValidate: false });
    return null;
  }, [watchName]);

  const watchPrice = form.watch("price");
  const watchMrp = form.watch("mrp");
  useEffect(() => {
    const p = Number(watchPrice);
    const m = Number(watchMrp);
    if (Number.isFinite(p) && Number.isFinite(m) && m > 0 && p >= 0) {
      if (p <= m) {
        const d = Math.round(((m - p) / m) * 100);
        form.setValue("discountPercentage", Math.max(0, Math.min(100, d)) as any, { shouldValidate: false, shouldDirty: true });
      } else {
        form.setValue("discountPercentage", 0 as any, { shouldValidate: false, shouldDirty: true });
      }
    }
  }, [watchPrice, watchMrp, form]);

  const addVariant = () => setVariants((prev) => [...prev, { id: `v-${Date.now()}`, sku: "", size: "", color: "", price: "", mrp: "", stock: "" }]);
  const removeVariant = (id: string) => setVariants((prev) => prev.filter((v) => v.id !== id));
  const addSpecification = () => setSpecifications((prev) => [...prev, { id: `s-${Date.now()}`, key: "", value: "" }]);
  const removeSpecification = (id: string) => setSpecifications((prev) => prev.filter((s) => s.id !== id));
  const addHighlight = () => setHighlights((prev) => [...prev, { id: `h-${Date.now()}`, text: "" }]);
  const removeHighlight = (id: string) => setHighlights((prev) => prev.filter((h) => h.id !== id));

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitError(null);
    if (images.length === 0) {
      const msg = "Please upload at least one product image.";
      setSubmitError(msg);
      error(msg);
      return;
    }

    const normalizedImages = images.map((img, i) => ({
      id: img.id || `img-${i + 1}`,
      url: img.url,
      alt: img.alt || values.name,
      isPrimary: !!img.isPrimary,
    }));
    if (!normalizedImages.some((i) => i.isPrimary)) normalizedImages[0].isPrimary = true;

    const cleanedVariants = variants
      .map((v, i) => ({
        id: `var-${i + 1}`,
        sku: String(v.sku || `${values.sku}-V${i + 1}`).trim().toUpperCase(),
        size: v.size?.trim() || undefined,
        color: v.color?.trim() || undefined,
        price: v.price === "" ? Number(values.price || 0) : Number(v.price),
        mrp: v.mrp === "" ? Number(values.mrp || 0) : Number(v.mrp),
        stock: v.stock === "" ? 0 : Number(v.stock),
      }))
      .filter((v) => v.sku || v.size || v.color);

    const cleanedSpecs = specifications
      .map((s) => ({ key: String(s.key || "").trim(), value: String(s.value || "").trim() }))
      .filter((s) => s.key && s.value);

    const cleanedHighlights = highlights.map((h) => String(h.text || "").trim()).filter(Boolean);

    const payload = {
      ...values,
      slug: slugify(values.slug || values.name),
      sku: String(values.sku || "").trim().toUpperCase(),
      barcode: values.barcode?.trim() || undefined,
      subcategory: values.subcategory?.trim() || undefined,
      brand: customBrand.trim() || values.brand?.trim() || undefined,
      shortDescription: values.shortDescription?.trim() || undefined,
      seoTitle: values.seoTitle?.trim() || undefined,
      seoDescription: values.seoDescription?.trim() || undefined,
      images: normalizedImages,
      variants: cleanedVariants,
      specifications: cleanedSpecs,
      highlights: cleanedHighlights,
      discountPercentage: Number(values.discountPercentage || 0),
      taxPercentage: Number(values.taxPercentage ?? 0),
      lowStockThreshold: Number(values.lowStockThreshold || 0),
      estimatedDeliveryDays: Number(values.estimatedDeliveryDays ?? 3),
      weight: Number(values.weight || 0),
      isFreeDelivery: !!values.isFreeDelivery,
      returnPolicy: values.returnPolicy ?? "",
      returnWindowDays: Number(values.returnWindowDays ?? 7),
      isReturnable: values.isReturnable ?? true,
    };

    setIsSaving(true);
    try {
      await sellerProductService.createProduct(sellerId, payload);
      success(values.status === "PENDING_APPROVAL" ? "Product submitted for approval." : "Product saved as draft.");
      router.push("/seller/products");
    } catch (err: any) {
      const msg = err?.message || "Failed to create product";
      setSubmitError(msg);
      error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/seller/products" className="inline-flex items-center gap-2 text-sm text-[#2874F0] font-semibold hover:underline">
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <h1 className="text-lg font-bold text-[#212121]">Add Product</h1>
      </div>

      <Card className="shadow-xl">
        <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2"><Package size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Basic Information</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Product Name</label>
                  <Input {...form.register("name")} placeholder="e.g. Samsung Galaxy S24" />
                  {form.formState.errors.name && <p className="text-[10px] text-[#E53935]">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Product Slug</label>
                  <Input {...form.register("slug")} placeholder="e.g. samsung-galaxy-s24" onBlur={(e) => form.setValue("slug", slugify(e.target.value), { shouldValidate: true })} />
                  {form.formState.errors.slug && <p className="text-[10px] text-[#E53935]">{form.formState.errors.slug.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">SKU</label>
                  <Input {...form.register("sku")} placeholder="e.g. ELE-SAM-S24-256" />
                  {form.formState.errors.sku && <p className="text-[10px] text-[#E53935]">{form.formState.errors.sku.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Barcode</label>
                  <Input {...form.register("barcode")} placeholder="e.g. 8901234567890" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Category</label>
                  <select {...form.register("category")} className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]">
                    <option value="">Select category</option>
                    {categoryOptions.map((c: string) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  {form.formState.errors.category && <p className="text-[10px] text-[#E53935]">{form.formState.errors.category.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Subcategory</label>
                  <Input {...form.register("subcategory")} placeholder="e.g. Smartphones" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Brand</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select {...form.register("brand")} className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]">
                      <option value="">Select brand</option>
                      {SELLER_BRANDS.map((b: string) => (<option key={b} value={b}>{b}</option>))}
                    </select>
                    <Input
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="Or enter custom brand name"
                    />
                  </div>
                  <p className="text-[10px] text-[#878787]">Select from dropdown or type a custom brand name.</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Description</label>
                <Textarea {...form.register("description")} rows={4} placeholder="Describe your product..." />
                {form.formState.errors.description && <p className="text-[10px] text-[#E53935]">{form.formState.errors.description.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Short Description</label>
                <Input {...form.register("shortDescription")} placeholder="Short product summary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Highlights</label>
                <div className="space-y-2">
                  {highlights.map((h) => (
                    <div key={h.id} className="flex gap-2">
                      <Input value={h.text} onChange={(e) => setHighlights((prev) => prev.map((x) => x.id === h.id ? { ...x, text: e.target.value } : x))} placeholder="Key feature..." />
                      <button type="button" onClick={() => removeHighlight(h.id)} className="p-1 text-[#878787] hover:text-[#E53935]"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addHighlight} className="w-auto"><Plus size={14} /> Add Highlight</Button>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2"><TagIcon size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Pricing & Inventory</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Selling Price (₹)</label><Input {...form.register("price")} type="number" min={0} step="0.01" placeholder="Enter selling price" />{form.formState.errors.price && <p className="text-[10px] text-[#E53935]">{form.formState.errors.price.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">MRP (₹)</label><Input {...form.register("mrp")} type="number" min={0} step="0.01" placeholder="Enter MRP" />{form.formState.errors.mrp && <p className="text-[10px] text-[#E53935]">{form.formState.errors.mrp.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Discount %</label><Input {...form.register("discountPercentage")} type="number" min={0} max={100} readOnly className="bg-[#F9FAFB]" placeholder="Auto-calculated" /><p className="text-[10px] text-[#878787]">Auto-calculated from Selling Price &amp; MRP.</p></div>
                {/* Tax % field commented out as requested
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Tax %</label><Input {...form.register("taxPercentage")} type="number" min={0} max={100} /></div>
                */}
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Stock Quantity</label><Input {...form.register("stock")} type="number" min={0} placeholder="Enter stock quantity" />{form.formState.errors.stock && <p className="text-[10px] text-[#E53935]">{form.formState.errors.stock.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Weight (g)</label><Input {...form.register("weight")} type="number" min={0} step="1" placeholder="Enter weight in grams" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Low Stock Threshold</label><Input {...form.register("lowStockThreshold")} type="number" min={0} placeholder="Enter low stock threshold" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Submission Status</label><select {...form.register("status")} className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"><option value="DRAFT">Save as Draft</option><option value="PENDING_APPROVAL">Submit for Approval</option></select><p className="text-[10px] text-[#878787]">Submitted products require admin approval before becoming visible to customers.</p></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Estimated Delivery (days)</label><Input {...form.register("estimatedDeliveryDays")} type="number" min={0} max={30} placeholder="e.g. 3" /></div>
                <div className="space-y-1.5 flex items-end pb-2"><label className="inline-flex items-center gap-2 text-sm text-[#212121]"><input type="checkbox" {...form.register("isFreeDelivery")} className="rounded-sm" /> Free delivery</label></div>
              </div>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2"><Plus size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Product Images</h3></div>
              <ProductImageUploader images={images} onChange={setImages} maxImages={5} />
              <p className="text-xs text-[#878787]">Upload at least 1 image (max 5). Images are uploaded and saved with the product.</p>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><TagIcon size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Product Variants (optional)</h3></div>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus size={14} /> Add Variant</Button>
              </div>
              <div className="space-y-3">
                {variants.map((v) => (
                  <div key={v.id} className="border border-[#E0E0E0] rounded-sm p-3 space-y-3">
                    <div className="flex justify-end"><button type="button" onClick={() => removeVariant(v.id)} className="p-1 text-[#878787] hover:text-[#E53935]"><Trash2 size={16} /></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">SKU</label><Input value={v.sku} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, sku: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Size</label><Input value={v.size} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, size: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Color</label><Input value={v.color} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, color: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Price (â‚¹)</label><Input value={v.price} type="number" min={0} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, price: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">MRP (â‚¹)</label><Input value={v.mrp} type="number" min={0} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, mrp: e.target.value } : x))} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#878787] uppercase">Stock</label><Input value={v.stock} type="number" min={0} onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, stock: e.target.value } : x))} /></div>
                    </div>
                  </div>
                ))}
                {variants.length === 0 && <p className="text-xs text-[#878787]">No variants added. Base product stock/pricing will be used.</p>}
              </div>
            </section>

            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><FileText size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Specifications</h3></div>
                <Button type="button" variant="outline" size="sm" onClick={addSpecification}><Plus size={14} /> Add Spec</Button>
              </div>
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
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">SEO Title</label><Input {...form.register("seoTitle")} placeholder="e.g. Samsung Galaxy S24 - Best Price" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-[#878787] uppercase tracking-wider">SEO Description</label><Textarea {...form.register("seoDescription")} rows={2} placeholder="Meta description for search engines" /></div>
              </div>
            </section>

            {/* Return Policy */}
            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2"><FileText size={18} className="text-[#2874F0]" /><h3 className="text-sm font-bold text-[#212121]">Return Policy</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Return Policy</label>
                  <Input {...form.register("returnPolicy")} placeholder="e.g. 7-day easy return, unused items only, original packaging required" />
                  {form.formState.errors.returnPolicy && <p className="text-[10px] text-[#E53935]">{form.formState.errors.returnPolicy.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Return Window (days)</label>
                  <Input {...form.register("returnWindowDays")} type="number" min="0" max="365" defaultValue={7} />
                  {form.formState.errors.returnWindowDays && <p className="text-[10px] text-[#E53935]">{form.formState.errors.returnWindowDays.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider block">Allow Returns</label>
                  <input {...form.register("isReturnable")} type="checkbox" defaultChecked className="w-4 h-4 rounded border-[#E0E0E0] text-[#2874F0] focus:ring-[#2874F0]" />
                </div>
              </div>
            </section>
            {submitError && <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>}

            <div className="flex gap-3 pt-6 border-t border-[#F0F0F0]">
              <Button type="button" variant="outline" onClick={() => router.push("/seller/products")}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={isSaving}><Save size={16} /> Save Product</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}




