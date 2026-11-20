"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/common/InputField";
import { useHydration } from "@/hooks/useHydration";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Zod schema ───────────────────────────────────────────────────────────────
const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or mobile number is required")
    .refine(
      (val) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ||
        /^[6-9]\d{9}$/.test(val.trim().replace(/\D/g, "")),
      "Enter a valid email address or 10-digit mobile number"
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Password strength bar ────────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const strength =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
      ? 3
      : password.length >= 6 && /[A-Z0-9]/.test(password)
      ? 2
      : 1;
  const labels = ["Weak", "Fair", "Strong"];
  const colors = ["bg-red-400", "bg-yellow-400", "bg-green-500"];
  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              s <= strength ? colors[strength - 1] : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", ["text-red-500", "text-yellow-600", "text-green-600"][strength - 1])}>
        {labels[strength - 1]}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useHydration();

  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const redirectTo = searchParams.get("redirect") || "/";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", rememberMe: false },
  });

  const passwordValue = watch("password");

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isHydrated, isAuthenticated, redirectTo, router]);

  useEffect(() => {
    if (!googleClientId) return;
    let cancelled = false;
    const init = () => {
      if (cancelled) return;
      const g = (window as any).google?.accounts?.id;
      if (!g || !googleBtnRef.current) return;
      try {
        g.initialize({
          client_id: googleClientId,
          callback: async (resp: any) => {
            if (!resp?.credential) return;
            setIsGoogleLoading(true);
            try {
              const { user } = await authService.loginWithGoogle(resp.credential);
              setUser(user);
              toast({
                type: "success",
                title: `Welcome, ${user.name.split(" ")[0]}!`,
                message: "Signed in with Google.",
                duration: 3000,
              });
              router.push(redirectTo);
            } catch (err: any) {
              toast({ type: "error", title: "Google Login Failed", message: err?.message || "Google login failed." });
            } finally {
              if (!cancelled) setIsGoogleLoading(false);
            }
          },
          ux_mode: "popup",
        });
        googleBtnRef.current.innerHTML = "";
        g.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 360,
        });
      } catch {
        // ignore init/render failures; existing login remains functional
      }
    };

    if ((window as any).google?.accounts?.id) {
      init();
      return () => { cancelled = true; };
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", init);
      return () => { cancelled = true; existing.removeEventListener("load", init); };
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.body.appendChild(script);
    return () => { cancelled = true; };
  }, [googleClientId, redirectTo, router, setUser, toast]);

  if (isHydrated && isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2874F0] border-t-transparent rounded-full animate-spin" aria-label="Redirecting" />
      </div>
    );
  }

  // ── Form submission ──────────────────────────────────────────────────────────
  const onSubmit = async (data: LoginFormData) => {
    try {
      const { user } = await authService.loginWithPassword(
        data.identifier,
        data.password
      );
      setUser(user);
      toast({
        type: "success",
        title: `Welcome back, ${user.name.split(" ")[0]}! 👋`,
        message: "You are now signed in.",
        duration: 3000,
      });
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      toast({ type: "error", title: "Login Failed", message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      {/* ── Left brand panel ───────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[380px] shrink-0"
        style={{ backgroundColor: "#2874F0" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-8">
            <Sparkles size={22} className="text-[#ffe500]" />
            <span className="text-white font-black text-xl tracking-tight">
              FlipStore
            </span>
          </div>
          <h1 className="text-white text-3xl font-bold leading-tight">
            Login
            <br />
            <span className="text-[#ffe500]">Millions of Products</span>
            <br />
            at Best Prices
          </h1>
          <p className="text-blue-100 mt-4 text-sm leading-relaxed">
            Get access to your Orders, Wishlist and tailored Recommendations.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "100% Safe & Secure Payments",
              "Original Products Guaranteed",
              "Easy Returns & Refunds",
            ].map((text) => (
              <div key={text} className="flex items-center gap-2 text-xs text-blue-100">
                <ShieldCheck size={15} className="text-[#ffe500] shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-200 text-xs">
          © 2026 FlipStore India. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ───────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 py-10">
        <div className="bg-white rounded-sm shadow-md border border-[#E0E0E0] w-full max-w-md p-6 sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[#878787] hover:text-[#2874F0] mb-5 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Store
          </Link>

          <h2 className="text-xl font-bold text-[#212121]">Sign in to FlipStore</h2>
          <p className="text-xs text-[#878787] mt-1 mb-6">
            Use your email or mobile number and password to continue
          </p>

          {/* ── Redirect notice ───────────────────────────────────────────── */}
          {redirectTo !== "/" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xs text-xs text-[#2874F0] font-medium">
              Please sign in to continue.
            </div>
          )}

          {/* ── Form ─────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Identifier */}
            <InputField
              label="Email or Mobile Number"
              type="text"
              placeholder="e.g. rahul@example.com or 9876543210"
              leftIcon={<Mail size={15} />}
              error={errors.identifier?.message}
              autoComplete="username"
              autoFocus
              {...register("identifier")}
            />

            {/* Password */}
            <div>
              <div className="relative">
                <InputField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  leftIcon={<Lock size={15} />}
                  error={errors.password?.message}
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-7 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrengthBar password={passwordValue} />
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-[#555] cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded-xs accent-[#2874F0] w-3.5 h-3.5"
                  {...register("rememberMe")}
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#2874F0] font-semibold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Terms note */}
            <p className="text-[11px] text-[#878787] leading-relaxed">
              By continuing, you agree to FlipStore&apos;s{" "}
              <span className="text-[#2874F0] cursor-pointer hover:underline">
                Terms of Use
              </span>{" "}
              and{" "}
              <span className="text-[#2874F0] cursor-pointer hover:underline">
                Privacy Policy
              </span>
              .
            </p>

            {/* Submit */}
            <Button
              type="submit"
              variant="buyNow"
              fullWidth
              isLoading={isSubmitting}
              className="text-sm font-bold tracking-wide"
            >
              Login
            </Button>
          </form>
          {googleClientId ? (
            <div className="mt-4">
              <div className="flex items-center gap-3 my-3">
                <div className="h-px flex-1 bg-[#E0E0E0]" />
                <span className="text-[11px] text-[#878787] font-medium">OR</span>
                <div className="h-px flex-1 bg-[#E0E0E0]" />
              </div>
              <div className="w-full overflow-hidden">
                <div ref={googleBtnRef} className="w-full min-h-[40px] flex justify-center" />
              </div>
              {isGoogleLoading && (
                <p className="text-xs text-[#2874F0] mt-2 text-center">Signing in with Google...</p>
              )}
            </div>
          ) : null}

          <div className="text-center text-xs text-[#878787] mt-5">
            New to FlipStore?{" "}
            <Link href="/register" className="text-[#2874F0] font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
