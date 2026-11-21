"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  UserCheck,
  MapPin,
  X,
  Eye,
} from "lucide-react";
import { User } from "@/types";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_FILTERS = [
  { value: "all", label: "All" },
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "admin", label: "Admin" },
] as const;

export function AdminCustomersClient() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "vendor" | "admin">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.id.toLowerCase().includes(q);
      const matchesRole =
        roleFilter === "all" || c.role.toLowerCase() === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [customers, searchQuery, roleFilter]);

  return (
    <div className="space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Customer Directory</h1>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {filteredCustomers.length} Verified Users
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Browse registered shoppers, inspect saved delivery destinations, and review account credentials.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadCustomers}
          className="h-9 text-xs font-semibold bg-white border-gray-300"
        >
          <RefreshCw size={13} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs">
        <div className="max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, email, or mobile..."
            className="pl-9 h-9 text-xs bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* ── Role Filter Pills ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs flex flex-wrap items-center gap-2">
        {ROLE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setRoleFilter(value)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              roleFilter === value
                ? "bg-[#2874F0] text-white border-[#2874F0]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          {filteredCustomers.length} of {customers.length}
        </span>
      </div>

      {/* ── Customers Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-gray-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
            Loading customer list...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700 text-sm">No customers match search</p>
            <p className="mt-1">Try another keyword or phone number.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((user) => {
                  const initials = user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#2874F0] text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{user.name}</p>
                            <span className="font-mono text-[10px] text-gray-400">ID: {user.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Mail size={12} className="text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Phone size={12} className="text-gray-400" />
                          <span>{user.phone || "+91 98765 43210"}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            user.role === "admin"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-gray-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Jan 2024"}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCustomer(user)}
                          className="h-7 text-xs px-2.5 text-[#2874F0] border-blue-200 hover:bg-blue-50"
                        >
                          <Eye size={12} className="mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Customer Details Modal ───────────────────────────────────────────── */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
            <div className="bg-white rounded-md max-w-lg w-full p-6 shadow-2xl relative space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#2874F0] text-white font-bold flex items-center justify-center text-base">
                  {selectedCustomer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#212121]">{selectedCustomer.name}</h2>
                  <p className="text-xs text-gray-500 font-mono">ID: {selectedCustomer.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Email Address:</span>
                <span className="font-semibold text-gray-900">{selectedCustomer.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Mobile Number:</span>
                <span className="font-semibold text-gray-900">
                  {selectedCustomer.phone || "+91 98765 43210"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Account Access Role:</span>
                <span className="font-bold text-[#2874F0]">{selectedCustomer.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">FlipStore Plus Member:</span>
                <span className="font-bold text-emerald-600">Active (VIP)</span>
              </div>
            </div>

            {/* Saved Addresses */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Saved Delivery Addresses ({(selectedCustomer.addresses || []).length})
              </h3>
              {(selectedCustomer.addresses || []).length === 0 ? (
                <p className="text-xs text-gray-400 italic">No saved addresses for this user.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="border border-gray-200 rounded p-2.5 text-xs bg-gray-50"
                    >
                      <div className="flex items-center justify-between font-bold text-gray-800">
                        <span>{addr.name} ({addr.type})</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-blue-100 text-[#2874F0] px-1.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">
                        {addr.street}, {addr.locality ? `${addr.locality}, ` : ""}{addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
