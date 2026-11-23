"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  returnUrl?: string;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function LoginModal({ isOpen, onClose, onLoginSuccess, returnUrl }: LoginModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleSdkLoaded, setGoogleSdkLoaded] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();
  const router = useRouter();

  const handleLoginSuccess = () => {
    if (returnUrl) {
      router.push(returnUrl);
    }
  };

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

  // Load Google Identity Services script
  useEffect(() => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement | null;
    if (!existing && GOOGLE_CLIENT_ID) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleSdkLoaded(true);
      document.head.appendChild(script);
    } else if (existing && GOOGLE_CLIENT_ID) {
      setGoogleSdkLoaded(true);
    }
  }, [GOOGLE_CLIENT_ID]);

  // Render Google Sign-In button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleSdkLoaded || !googleBtnRef.current) return;

    const g = (window as any).google?.accounts?.id;
    if (!g) return;

    // Initialize Google Identity Services first
    g.initialize({
      client_id: GOOGLE_CLIENT_ID,
      context: "signin",
      ux_mode: "popup",
      callback: async (resp: any) => {
        if (!resp?.credential) return;
        setIsGoogleLoading(true);
        try {
          const { user } = await authService.loginWithGoogle(resp.credential);
          setUser(user);
          toast({ type: "success", title: "Signed in with Google.", message: "Welcome back!" });
          onClose();
          if (returnUrl) {
            router.push(returnUrl);
          }
        } catch (err: any) {
          toast({ type: "error", title: "Google Login Failed", message: err?.message || "Google login failed." });
        } finally {
          setIsGoogleLoading(false);
        }
      },
    });

    // Then render the button
    g.renderButton(googleBtnRef.current, {
      client_id: GOOGLE_CLIENT_ID,
      context: "signin",
      ux_mode: "popup",
      size: "large",
      width: "100%",
      theme: "outline",
      shape: "rectangular",
      text: "continue_with",
      logo_alignment: "left",
    });
  }, [GOOGLE_CLIENT_ID, googleSdkLoaded, googleBtnRef.current, onClose, returnUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { user } = await authService.loginWithPassword(identifier, password);
      setUser(user);
      toast({ type: "success", title: "Logged in", message: "Welcome back!" });
      onClose();
      if (returnUrl) {
        router.push(returnUrl);
      }
    } catch (err: any) {
      toast({ type: "error", title: "Login Failed", message: err?.message || "Login failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const activePanel = showRegister ? "register" : "login";

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
          {activePanel === "login" ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-bold text-[#212121]">Sign In</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
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
                {GOOGLE_CLIENT_ID && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <p className="text-[10px] text-[#878787] font-semibold uppercase tracking-wider">Or continue with</p>
                    <div ref={googleBtnRef} className="w-full h-[52px]" />
                  </div>
                )}
                <p className="text-center text-xs text-[#878787] mt-4">
                  New to FlipStore?{" "}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowRegister(true);
                    }}
                    className="text-[#2874F0] font-semibold hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <RegisterModal
              isOpen={true}
              onClose={() => setShowRegister(false)}
              onRegisterSuccess={handleLoginSuccess}
            />
          )}
        </div>
      </div>
    </>
  );
}
