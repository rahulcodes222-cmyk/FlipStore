"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authService } from "@/services/authService";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/common/InputField";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Schemas ──────────────────────────────────────────────────────────────────
const identifierSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or mobile number is required")
    .refine(
      (val) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ||
        /^[6-9]\d{9}$/.test(val.trim().replace(/\D/g, "")),
      "Enter a valid email address or 10-digit mobile number"
    ),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "Enter the 6-digit OTP")
    .max(6, "OTP must be exactly 6 digits")
    .refine((v) => /^\d{6}$/.test(v), "OTP must be 6 digits"),
});

const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((v) => /[A-Z]/.test(v), "Include at least one uppercase letter")
      .refine((v) => /[0-9]/.test(v), "Include at least one number")
      .refine(
        (v) => /[^A-Za-z0-9]/.test(v),
        "Include at least one special character"
      ),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type IdentifierData = z.infer<typeof identifierSchema>;
type OtpData = z.infer<typeof otpSchema>;
type NewPasswordData = z.infer<typeof newPasswordSchema>;

type Step = "identifier" | "otp" | "new-password" | "success";

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step | string; label: string }[] = [
    { key: "identifier", label: "Verify" },
    { key: "otp", label: "OTP" },
    { key: "new-password", label: "New Password" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors",
                i < stepIndex
                  ? "bg-[#388E3C] text-white"
                  : i === stepIndex
                  ? "bg-[#2874F0] text-white"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              {i < stepIndex ? <CheckCircle2 size={12} /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[11px] font-medium hidden sm:block",
                i === stepIndex ? "text-[#2874F0]" : "text-[#878787]"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-px transition-colors",
                i < stepIndex ? "bg-[#388E3C]" : "bg-gray-200"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 1: Identifier form ─────────────────────────────────────────────────
  const identifierForm = useForm<IdentifierData>({
    resolver: zodResolver(identifierSchema),
    defaultValues: { identifier: "" },
  });

  const onIdentifierSubmit = async (data: IdentifierData) => {
    try {
      await authService.sendPasswordReset(data.identifier);
      setIdentifier(data.identifier);
      toast({
        type: "info",
        title: "OTP Sent",
        message: "Use code 123456 for this demo (any 6 digits work).",
        duration: 6000,
      });
      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      toast({ type: "error", message: msg });
    }
  };

  // ── Step 2: OTP form ────────────────────────────────────────────────────────
  const otpForm = useForm<OtpData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onOtpSubmit = async (data: OtpData) => {
    // Mock: accept any 6-digit OTP
    if (data.otp.length === 6) {
      setStep("new-password");
    }
  };

  // ── Step 3: New password form ───────────────────────────────────────────────
  const passwordForm = useForm<NewPasswordData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  const newPasswordValue = passwordForm.watch("newPassword");

  const onNewPasswordSubmit = async (data: NewPasswordData) => {
    try {
      await authService.resetPassword(identifier, otpForm.getValues("otp"), data.newPassword);
      toast({
        type: "success",
        title: "Password Reset Successful!",
        message: "You can now log in with your new password.",
      });
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password.";
      toast({ type: "error", message: msg });
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
            Forgot
            <br />
            <span className="text-[#ffe500]">your password?</span>
          </h1>
          <p className="text-blue-100 mt-4 text-sm leading-relaxed">
            Don&apos;t worry! Enter your registered email or mobile and we&apos;ll send you a
            one-time code to reset your password.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Quick 3-step recovery",
              "Secure OTP verification",
              "Instant access restored",
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="bg-white rounded-sm shadow-md border border-[#E0E0E0] w-full max-w-md p-6 sm:p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-[#878787] hover:text-[#2874F0] mb-5 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Login
          </Link>

          {step !== "success" && (
            <>
              <h2 className="text-xl font-bold text-[#212121]">Reset Password</h2>
              <p className="text-xs text-[#878787] mt-1 mb-4">
                {step === "identifier" && "Enter your email or mobile to receive an OTP"}
                {step === "otp" && `Enter the 6-digit OTP sent to ${identifier}`}
                {step === "new-password" && "Create a strong new password"}
              </p>
              <StepIndicator currentStep={step} />
            </>
          )}

          {/* ── Step 1: Identifier ─────────────────────────────────────────── */}
          {step === "identifier" && (
            <form
              onSubmit={identifierForm.handleSubmit(onIdentifierSubmit)}
              className="space-y-4"
              noValidate
            >
              <InputField
                label="Email or Mobile Number"
                type="text"
                placeholder="e.g. rahul@example.com or 9876543210"
                leftIcon={<Mail size={15} />}
                error={identifierForm.formState.errors.identifier?.message}
                autoFocus
                {...identifierForm.register("identifier")}
              />

              <Button
                type="submit"
                variant="buyNow"
                fullWidth
                isLoading={identifierForm.formState.isSubmitting}
                className="text-sm font-bold"
              >
                Send OTP
              </Button>

              {/* Quick fill for demo users */}
              <div className="text-center text-[11px] text-[#878787] pt-1 space-y-1">
                <p>Demo accounts you can reset:</p>
                <div className="flex justify-center gap-3">
                  {["aarav.mehta@example.com", "admin@flipstore.in"].map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() =>
                        identifierForm.setValue("identifier", e, { shouldValidate: false })
                      }
                      className="text-[#2874F0] hover:underline cursor-pointer"
                    >
                      {e.split("@")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ── Step 2: OTP ────────────────────────────────────────────────── */}
          {step === "otp" && (
            <form
              onSubmit={otpForm.handleSubmit(onOtpSubmit)}
              className="space-y-4"
              noValidate
            >
              <InputField
                label="6-Digit OTP"
                type="text"
                placeholder="Enter 6-digit code"
                leftIcon={<KeyRound size={15} />}
                maxLength={6}
                error={otpForm.formState.errors.otp?.message}
                autoFocus
                helperText="Demo: enter any 6 digits (e.g. 123456)"
                {...otpForm.register("otp", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  },
                })}
              />

              {/* OTP quick fill */}
              <div className="flex gap-2">
                {["123456", "000000"].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() =>
                      otpForm.setValue("otp", code, { shouldValidate: true })
                    }
                    className="px-3 py-1 text-xs border border-blue-200 text-[#2874F0] font-semibold rounded-xs bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    Use {code}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={otpForm.formState.isSubmitting}
                className="text-sm font-bold"
              >
                Verify OTP
              </Button>

              <div className="flex justify-between text-xs text-[#878787]">
                <button
                  type="button"
                  onClick={() => setStep("identifier")}
                  className="text-[#2874F0] hover:underline cursor-pointer"
                >
                  ← Change email/mobile
                </button>
                <button
                  type="button"
                  onClick={() => identifierForm.handleSubmit(onIdentifierSubmit)()}
                  className="text-[#878787] hover:text-[#2874F0] cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: New Password ────────────────────────────────────────── */}
          {step === "new-password" && (
            <form
              onSubmit={passwordForm.handleSubmit(onNewPasswordSubmit)}
              className="space-y-4"
              noValidate
            >
              <div>
                <div className="relative">
                  <InputField
                    label="New Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
                    leftIcon={<Lock size={15} />}
                    error={passwordForm.formState.errors.newPassword?.message}
                    autoFocus
                    autoComplete="new-password"
                    {...passwordForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-7 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label="Toggle visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bars */}
                {newPasswordValue && (
                  <div className="mt-1.5 flex gap-1">
                    {[1, 2, 3, 4].map((s) => {
                      const filled =
                        [
                          newPasswordValue.length >= 8,
                          /[A-Z]/.test(newPasswordValue),
                          /[0-9]/.test(newPasswordValue),
                          /[^A-Za-z0-9]/.test(newPasswordValue),
                        ].filter(Boolean).length >= s;
                      return (
                        <div
                          key={s}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-all",
                            filled
                              ? s <= 1
                                ? "bg-red-400"
                                : s <= 2
                                ? "bg-yellow-400"
                                : s <= 3
                                ? "bg-blue-400"
                                : "bg-green-500"
                              : "bg-gray-200"
                          )}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="relative">
                <InputField
                  label="Confirm New Password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  leftIcon={<Lock size={15} />}
                  error={passwordForm.formState.errors.confirmNewPassword?.message}
                  autoComplete="new-password"
                  {...passwordForm.register("confirmNewPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-7 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Toggle visibility"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={passwordForm.formState.isSubmitting}
                className="text-sm font-bold"
              >
                Set New Password
              </Button>
            </form>
          )}

          {/* ── Step 4: Success ─────────────────────────────────────────────── */}
          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} className="text-[#388E3C]" />
              </div>
              <h2 className="text-xl font-bold text-[#212121]">
                Password Reset Successfully!
              </h2>
              <p className="text-xs text-[#878787] mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
                Your password has been updated. You can now log in to your FlipStore account
                with your new password.
              </p>
              <Button
                variant="primary"
                fullWidth
                onClick={() => router.push("/login")}
                className="text-sm font-bold"
              >
                Login Now
              </Button>
              <Link
                href="/"
                className="block text-xs text-[#878787] mt-3 hover:text-[#2874F0] transition-colors"
              >
                Continue Shopping →
              </Link>
            </div>
          )}

          {step !== "success" && (
            <div className="text-center text-xs text-[#878787] mt-5">
              Remembered your password?{" "}
              <Link href="/login" className="text-[#2874F0] font-semibold hover:underline">
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
