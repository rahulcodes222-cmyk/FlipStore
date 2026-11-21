"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/common/InputField";
import { X, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { user } = await authService.loginWithPassword(identifier, password);
      setUser(user);
      toast({ type: "success", title: "Logged in", message: "Welcome back!" });
      onClose();
      onLoginSuccess?.();
    } catch (err: any) {
      toast({ type: "error", title: "Login Failed", message: err?.message || "Login failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-sm shadow-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#212121]">Sign In</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-[#878787] mb-6">Enter your email or mobile and password to continue</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <InputField
            label="Email or Mobile Number"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leftIcon={<Mail size={15} />}
            required
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={15} />}
            required
          />
          <Button type="submit" variant="buyNow" fullWidth isLoading={isSubmitting} className="text-sm font-bold">
            Login
          </Button>
        </form>
        <p className="text-center text-xs text-[#878787] mt-4">
          New to FlipStore?{" "}
          <a href="/register" className="text-[#2874F0] font-semibold hover:underline">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
