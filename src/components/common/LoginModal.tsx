"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/common/InputField";
import { X, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { RegisterModal } from "./RegisterModal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
    <>
      <div className="fixed inset-0 z-50" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-bold text-[#212121]">Sign In</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-xs text-[#878787]">Enter your email or mobile and password to continue</p>
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
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  setRegisterModalOpen(true);
                }}
                className="text-[#2874F0] font-semibold hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
      {registerModalOpen && (
        <RegisterModal
          isOpen={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          onRegisterSuccess={onLoginSuccess}
        />
      )}
    </>
  );
}
