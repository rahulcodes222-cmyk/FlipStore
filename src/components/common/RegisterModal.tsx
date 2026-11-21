"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/common/InputField";
import {
  X,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(60, "Name is too long"),
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

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void;
}

export function RegisterModal({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<z.infer<typeof registerSchema>>({
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

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true);
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
      });
      onClose();
      onRegisterSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      toast({ type: "error", title: "Registration Failed", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
          <ArrowLeft
            size={20}
            className="text-[#2874F0] cursor-pointer hover:text-[#1259c7]"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
          <h2 className="text-lg font-bold text-[#212121]">Create Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-[#878787] mb-2">Fill in your details to get started</p>
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
                onChange: (e: any) => {
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
                  className="absolute right-3 top-7 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                className="absolute right-3 top-7 text-gray-400 hover:text-gray-600 cursor-pointer"
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
              isLoading={isSubmitting || formIsSubmitting}
              className="text-sm font-bold tracking-wide mt-2"
            >
              Create Account
            </Button>
          </form>

          <div className="text-center text-xs text-[#878787] mt-4">
            Already have an account?{" "}
            <button
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              className="text-[#2874F0] font-semibold hover:underline"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
