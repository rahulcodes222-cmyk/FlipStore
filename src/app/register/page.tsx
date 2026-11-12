"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/common/InputField";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Zod schema ───────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(60, "Name is too long")
      .refine((v) => /^[a-zA-Z\s.'-]+$/.test(v), "Name contains invalid characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    phone: z
      .string()
      .min(1, "Mobile number is required")
      .refine(
        (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")),
        "Enter a valid 10-digit Indian mobile number"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (v) => /[A-Z]/.test(v),
        "Include at least one uppercase letter"
      )
      .refine(
        (v) => /[0-9]/.test(v),
        "Include at least one number"
      )
      .refine(
        (v) => /[^A-Za-z0-9]/.test(v),
        "Include at least one special character (e.g. @, #, !)"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z
      .boolean()
      .refine((v) => v === true, "You must accept the Terms & Conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Password strength indicator ─────────────────────────────────────────────
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  barColor: string;
} {
  if (!password) return { score: 0, label: "", color: "", barColor: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { score: 0, label: "", color: "", barColor: "" },
    { score: 1, label: "Weak", color: "text-red-500", barColor: "bg-red-400" },
    { score: 2, label: "Fair", color: "text-yellow-600", barColor: "bg-yellow-400" },
    { score: 3, label: "Good", color: "text-blue-500", barColor: "bg-blue-400" },
    { score: 4, label: "Strong", color: "text-green-600", barColor: "bg-green-500" },
  ];
  return levels[score] || levels[0];
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, color, barColor } = getPasswordStrength(password);
  if (!password) return null;

  const requirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter" },
    { met: /[0-9]/.test(password), text: "One number" },
    { met: /[^A-Za-z0-9]/.test(password), text: "One special character" },
  ];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              s <= score ? barColor : "bg-gray-200"
            )}
          />
        ))}
      </div>
      {label && <p className={cn("text-[11px] font-semibold", color)}>{label}</p>}
      <ul className="space-y-0.5">
        {requirements.map((r) => (
          <li
            key={r.text}
            className={cn(
              "flex items-center gap-1.5 text-[11px] transition-colors",
              r.met ? "text-green-600" : "text-[#878787]"
            )}
          >
            <CheckCircle2 size={11} className={r.met ? "text-green-500" : "text-gray-300"} />
            {r.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setUser = useAuthStore((state) => state.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { user } = await authService.register({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.replace(/\D/g, ""),
        password: data.password,
      });

      setUser(user);
      toast({
        type: "success",
        title: `Welcome, ${user.name.split(" ")[0]}! 🎉`,
        message: "Your account has been created successfully.",
        duration: 4000,
      });
      router.push("/");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      toast({ type: "error", title: "Registration Failed", message: msg });
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
            <span className="text-white font-black text-xl tracking-tight">FlipStore</span>
          </div>
          <h1 className="text-white text-3xl font-bold leading-tight">
            Looks like
            <br />
            <span className="text-[#ffe500]">you&apos;re new here!</span>
          </h1>
          <p className="text-blue-100 mt-4 text-sm leading-relaxed">
            Sign up to get exclusive member deals, faster checkout, wishlist syncing,
            and order tracking across devices.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Plus Membership Rewards",
              "Personalised Recommendations",
              "Priority Customer Support",
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
      <div className="flex-1 flex items-start justify-center p-4 sm:p-8 py-8 overflow-y-auto">
        <div className="bg-white rounded-sm shadow-md border border-[#E0E0E0] w-full max-w-md p-6 sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[#878787] hover:text-[#2874F0] mb-5 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Store
          </Link>

          <h2 className="text-xl font-bold text-[#212121]">
            Create your FlipStore Account
          </h2>
          <p className="text-xs text-[#878787] mt-1 mb-6">
            Fill in your details below to get started
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full Name */}
            <InputField
              label="Full Name"
              type="text"
              placeholder="e.g. Ramesh Kumar"
              leftIcon={<User size={15} />}
              error={errors.name?.message}
              autoComplete="name"
              autoFocus
              {...register("name")}
            />

            {/* Email */}
            <InputField
              label="Email Address"
              type="email"
              placeholder="e.g. ramesh@example.com"
              leftIcon={<Mail size={15} />}
              error={errors.email?.message}
              autoComplete="email"
              {...register("email")}
            />

            {/* Mobile */}
            <InputField
              label="Mobile Number"
              type="tel"
              placeholder="10-digit Indian mobile number"
              leftIcon={<Phone size={15} />}
              prefixText="+91"
              maxLength={10}
              error={errors.phone?.message}
              autoComplete="tel"
              {...register("phone", {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                },
              })}
            />

            {/* Password */}
            <div>
              <div className="relative">
                <InputField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
                  leftIcon={<Lock size={15} />}
                  error={errors.password?.message}
                  autoComplete="new-password"
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
              <PasswordStrengthMeter password={passwordValue} />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <InputField
                label="Confirm Password"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                leftIcon={<Lock size={15} />}
                error={errors.confirmPassword?.message}
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-7 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded-xs accent-[#2874F0] w-3.5 h-3.5 shrink-0"
                  {...register("terms")}
                />
                <span className="text-xs text-[#555] leading-relaxed">
                  I agree to the{" "}
                  <Link
                    href="#"
                    className="text-[#2874F0] font-semibold hover:underline"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#"
                    className="text-[#2874F0] font-semibold hover:underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  of FlipStore India
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  {errors.terms.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="buyNow"
              fullWidth
              isLoading={isSubmitting}
              className="text-sm font-bold tracking-wide mt-2"
            >
              Create Account
            </Button>
          </form>

          <div className="text-center text-xs text-[#878787] mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2874F0] font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
