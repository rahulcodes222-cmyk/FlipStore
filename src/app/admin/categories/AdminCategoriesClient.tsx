"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { Category } from "@/types";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminCategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error(err);
      setLoadError(err?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=300&q=80");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Category name is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingCategory) {
        const updated = await adminService.updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: description.trim(),
          image: image.trim(),
        });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      } else {
        const created = await adminService.createCategory({
          name: name.trim(),
          slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: description.trim(),
          image: image.trim(),
          itemCount: 0,
          isFeatured: false,
        } as any);
        setCategories((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err?.message || "Failed to save category";
      setErrorMsg(msg.includes("401") || /auth|unauthor/i.test(msg) ? `${msg} Please log in with an admin account.` : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${catName}"?`)) {
      return;
    }
    try {
      await adminService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err?.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Categories</h1>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Organize catalog products into categories. Changes are saved to the database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCategories} className="h-9 text-xs font-semibold bg-white border-gray-300">
            <RefreshCw size={13} className="mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={openAddModal} className="h-9 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white">
            <Plus size={14} className="mr-1" />
            Add Category
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{loadError}{/auth|unauthor/i.test(loadError) ? " Please log in as an admin." : ""}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-xs bg-white rounded border border-gray-200">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="font-bold text-gray-700 text-sm">No categories found</p>
          <p className="mt-1">Add your first category to save it in the database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="relative h-32 w-full bg-gray-100 border-b border-gray-100">
                {cat.image ? (
                  <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400"><Layers size={32} /></div>
                )}
                <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {cat.itemCount || 0} Products
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#212121]">{cat.name}</h3>
                  <p className="text-[11px] font-mono text-[#2874F0] mt-0.5">/{cat.slug}</p>
                  {cat.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{cat.description}</p>}
                </div>
                <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-gray-100">
                  <Button size="sm" variant="outline" onClick={() => openEditModal(cat)} className="h-7 text-xs px-2.5 text-gray-600 hover:text-[#2874F0] border-gray-200">
                    <Edit2 size={12} className="mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(cat.id, cat.name)} className="h-7 text-xs px-2 text-gray-400 hover:text-red-600 hover:border-red-200">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { if (!submitting) setIsModalOpen(false); }}>
          <div className="bg-white rounded-md max-w-md w-full p-5 shadow-2xl relative space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#212121]">{editingCategory ? "Edit Category" : "Add New Category"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name <span className="text-red-500">*</span></label>
                <Input required value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Smart Watches" className="h-9 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">URL Slug <span className="text-red-500">*</span></label>
                <Input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="smart-watches" className="h-9 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Image Banner URL</label>
                <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://images.unsplash.com/..." className="h-9 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <Textarea rows={3} value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder="Short summary of products in this category..." className="text-xs" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-8 text-xs font-semibold">Cancel</Button>
                <Button type="submit" disabled={submitting} className="h-8 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white">
                  {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
