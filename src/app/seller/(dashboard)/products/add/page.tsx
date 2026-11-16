"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { cn } from "@/lib/utils";
import { SELLER_CATEGORIES, SELLER_BRANDS } from "@/data/sellerManagement";

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
  discountPercentage: z.coerce.number().min(0).max(100),
  taxPercentage: z.coerce.number().min(0).max(100),
  stock: z.coerce.number().min(0, "Stock must be positive"),
  lowStockThreshold: z.coerce.number().min(0),
  status: z.enum(["DRAFT", "PUBLISHED", "OUT_OF_STOCK", "REJECTED"]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
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

export default function SellerAddProductPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { toast, success, error } = useToast();
  const router = useRouter();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [isSaving, setIsSaving] = useState(false);
  const [variants, setVariants] = useState<VariantForm[]>([
    { id: "v-1", sku: "", size: "", color: "", price: "", mrp: "", stock: "" },
  ]);
  const [specifications, setSpecifications] = useState<SpecForm[]>([
    { id: "s-1", key: "", value: "" },
  ]);
  const [highlights, setHighlights] = useState<HighlightForm[]>([
    { id: "h-1", text: "" },
  ]);
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
      taxPercentage: 0,
      stock: 0,
      lowStockThreshold: 0,
      status: "DRAFT",
      seoTitle: "",
      seoDescription: "",
    },
  });

  const addVariant = () => {
    setVariants([...variants, { id: `v-${Date.now()}`, sku: "", size: "", color: "", price: "", mrp: "", stock: "" }]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { id: `s-${Date.now()}`, key: "", value: "" }]);
  };

  const removeSpecification = (id: string) => {
    setSpecifications(specifications.filter((s) => s.id !== id));
  };

  const addHighlight = () => {
    setHighlights([...highlights, { id: `h-${Date.now()}`, text: "" }]);
  };

  const removeHighlight = (id: string) => {
    setHighlights(highlights.filter((h) => h.id !== id));
  };

  const handleSubmit = async (values: any) => {
    setIsSaving(true);
    try {
      const productImages = images.map((img, i) => ({
        id: img.id,
        url: img.url,
        alt: img.alt || values.name,
        isPrimary: img.isPrimary,
      }));
      const productVariants = variants.map((v, i) => ({
        id: `var-${i + 1}`,
        sku: v.sku || `${values.sku}-V${i + 1}`,
        size: v.size || undefined,
        color: v.color || undefined,
        price: parseFloat(v.price) || 0,
        mrp: parseFloat(v.mrp) || 0,
        stock: parseInt(v.stock) || 0,
      }));
      const productSpecs = specifications.map((s) => ({ key: s.key, value: s.value }));
      const productHighlights = highlights.filter((h) => h.text.trim()).map((h) => h.text);

      await sellerProductService.createProduct(sellerId, {
        ...values,
        images: productImages,
        variants: productVariants,
        specifications: productSpecs,
        highlights: productHighlights,
        isAssured: false,
        isFreeDelivery: false,
        estimatedDeliveryDays: 3,
      });
      success("Product created successfully");
      // Navigate to products list
      // Use router push
      (window as any).location.href = "/seller/products";
    } catch (err: any) {
      error(err.message || "Failed to create product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-2 text-sm text-[#2874F0] font-semibold hover:underline"
        >
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <h1 className="text-lg font-bold text-[#212121]">Add Product</h1>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Basic Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={18} className="text-[#2874F0]" />
                <h3 className="text-sm font-bold text-[#212121]">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Product Name</label>
                  <Input {...form.register("name")} placeholder="e.g. Samsung Galaxy S24" />
                  {form.formState.errors.name && <p className="text-[10px] text-[#E53935]">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Product Slug</label>
                  <Input {...form.register("slug")} placeholder="e.g. samsung-galaxy-s24" />
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
                  <select
                    {...form.register("category")}
                    className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                  >
                    <option value="">Select category</option>
                    {SELLER_CATEGORIES.map((c: string) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {form.formState.errors.category && <p className="text-[10px] text-[#E53935]">{form.formState.errors.category.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Subcategory</label>
                  <Input {...form.register("subcategory")} placeholder="e.g. Smartphones" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Brand</label>
                  <select
                    {...form.register("brand")}
                    className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                  >
                    <option value="">Select brand</option>
                    {SELLER_BRANDS.map((b: string) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
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
                      <Input value={h.text} onChange={(e) => {
                        const next = [...highlights];
                        const idx = next.findIndex((x) => x.id === h.id);
                        next[idx] = { ...next[idx], text: e.target.value };
                        setHighlights(next);
                      }} placeholder="Key feature..." />
                      <button type="button" onClick={() => removeHighlight(h.id)} className="p-1 text-[#878787] hover:text-[#E53935]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addHighlight} className="w-auto">
                    <Plus size={14} /> Add Highlight
                  </Button>
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <TagIcon size={18} className="text-[#2874F0]" />
                <h3 className="text-sm font-bold text-[#212121]">Pricing</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Selling Price (₹)</label>
                  <Input {...form.register("price")} type="number" />
                  {form.formState.errors.price && <p className="text-[10px] text-[#E53935]">{form.formState.errors.price.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Original Price / MRP (₹)</label>
                  <Input {...form.register("mrp")} type="number" />
                  {form.formState.errors.mrp && <p className="text-[10px] text-[#E53935]">{form.formState.errors.mrp.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Discount %</label>
                  <Input {...form.register("discountPercentage")} type="number" />
                  {form.formState.errors.discountPercentage && <p className="text-[10px] text-[#E53935]">{form.formState.errors.discountPercentage.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Tax %</label>
                  <Input {...form.register("taxPercentage")} type="number" defaultValue="18" />
                  {form.formState.errors.taxPercentage && <p className="text-[10px] text-[#E53935]">{form.formState.errors.taxPercentage.message}</p>}
                </div>
              </div>
            </section>

            {/* Inventory */}
            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={18} className="text-[#2874F0]" />
                <h3 className="text-sm font-bold text-[#212121]">Inventory</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Stock Quantity</label>
                  <Input {...form.register("stock")} type="number" />
                  {form.formState.errors.stock && <p className="text-[10px] text-[#E53935]">{form.formState.errors.stock.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Low Stock Threshold</label>
                  <Input {...form.register("lowStockThreshold")} type="number" />
                  {form.formState.errors.lowStockThreshold && <p className="text-[10px] text-[#E53935]">{form.formState.errors.lowStockThreshold.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Product Status</label>
                <select
                  {...form.register("status")}
                  className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
            </section>

            {/* Images */}
            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Plus size={18} className="text-[#2874F0]" />
                <h3 className="text-sm font-bold text-[#212121]">Product Images</h3>
              </div>
              <ProductImageUploader images={images} onChange={setImages} maxImages={5} />
              <p className="text-xs text-[#878787]">Upload up to 5 images. First image will be primary.</p>
            </section>

            {/* Variants */}
            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TagIcon size={18} className="text-[#2874F0]" />
                  <h3 className="text-sm font-bold text-[#212121]">Product Variants</h3>
                </div>
                <Button variant="outline" size="sm" onClick={addVariant}>
                  <Plus size={14} /> Add Variant
                </Button>
              </div>
              <div className="space-y-3">
                {variants.map((v) => (
                  <div key={v.id} className="border border-[#E0E0E0] rounded-sm p-3 space-y-3">
                    <div className="flex justify-between items-end">
                      <button
                        type="button"
                        onClick={() => removeVariant(v.id)}
                        className="p-1 text-[#878787] hover:text-[#E53935]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#878787] uppercase">SKU</label>
                        <Input value={v.sku} onChange={(e) => {
                          const next = [...variants];
                          const idx = next.findIndex((x) => x.id === v.id);
                          next[idx] = { ...next[idx], sku: e.target.value };
                          setVariants(next);
                        }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#878787] uppercase">Size</label>
                        <Input value={v.size} onChange={(e) => {
                          const next = [...variants];
                          const idx = next.findIndex((x) => x.id === v.id);
                          next[idx] = { ...next[idx], size: e.target.value };
                          setVariants(next);
                        }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#878787] uppercase">Color</label>
                        <Input value={v.color} onChange={(e) => {
                          const next = [...variants];
                          const idx = next.findIndex((x) => x.id === v.id);
                          next[idx] = { ...next[idx], color: e.target.value };
                          setVariants(next);
                        }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#878787] uppercase">Price (₹)</label>
                        <Input value={v.price} onChange={(e) => {
                          const next = [...variants];
                          const idx = next.findIndex((x) => x.id === v.id);
                          next[idx] = { ...next[idx], price: e.target.value };
                          setVariants(next);
                        }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#878787] uppercase">Stock</label>
                        <Input value={v.stock} onChange={(e) => {
                          const next = [...variants];
                          const idx = next.findIndex((x) => x.id === v.id);
                          next[idx] = { ...next[idx], stock: e.target.value };
                          setVariants(next);
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Specifications */}
            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#2874F0]" />
                  <h3 className="text-sm font-bold text-[#212121]">Specifications</h3>
                </div>
                <Button variant="outline" size="sm" onClick={addSpecification}>
                  <Plus size={14} /> Add Spec
                </Button>
              </div>
              <div className="space-y-3">
                {specifications.map((s) => (
                  <div key={s.id} className="border border-[#E0E0E0] rounded-sm p-3 space-y-2">
                    <div className="flex justify-between items-end">
                      <button
                        type="button"
                        onClick={() => removeSpecification(s.id)}
                        className="p-1 text-[#878787] hover:text-[#E53935]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#878787] uppercase">Key</label>
                        <Input value={s.key} onChange={(e) => {
                          const next = [...specifications];
                          const idx = next.findIndex((x) => x.id === s.id);
                          next[idx] = { ...next[idx], key: e.target.value };
                          setSpecifications(next);
                        }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#878787] uppercase">Value</label>
                        <Input value={s.value} onChange={(e) => {
                          const next = [...specifications];
                          const idx = next.findIndex((x) => x.id === s.id);
                          next[idx] = { ...next[idx], value: e.target.value };
                          setSpecifications(next);
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SEO */}
            <section className="space-y-4 border-t border-[#F0F0F0] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle size={18} className="text-[#2874F0]" />
                <h3 className="text-sm font-bold text-[#212121]">SEO</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">SEO Title</label>
                  <Input {...form.register("seoTitle")} placeholder="e.g. Samsung Galaxy S24 - Best Price" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">SEO Description</label>
                  <Textarea {...form.register("seoDescription")} rows={2} placeholder="Meta description for search engines" />
                </div>
              </div>
            </section>

            <div className="flex gap-3 pt-6 border-t border-[#F0F0F0]">
              <Button variant="outline" onClick={() => router.push("/seller/products")}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSaving}>
                <Save size={16} /> Publish Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
