"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle, ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sellerAuthService } from "@/services";
import { cn } from "@/lib/utils";

export default function SellerForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<"send" | "sent">("send");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await sellerAuthService.sendPasswordReset(identifier);
      setStep("sent");
    } catch (err: any) {
      setError(err.message || "Request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F3F6] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-2">
          <Store size={24} className="text-[#2874F0]" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg tracking-tight text-[#212121]">FlipStore</span>
            <span className="text-[#ffe500] text-xs font-bold uppercase tracking-wider">Seller Hub</span>
          </div>
        </div>

        <Card className="mt-6 shadow-xl">
          <CardHeader>
            {step === "send" ? (
              <>
                <CardTitle className="text-lg">Reset Password</CardTitle>
                <p className="text-center text-xs text-[#878787] mt-1">
                  Enter your email or mobile number to receive a reset link
                </p>
              </>
            ) : (
              <>
                <CardTitle className="text-lg">Check your inbox</CardTitle>
                <p className="text-center text-xs text-[#878787] mt-1">
                  A reset link has been sent to {identifier}
                </p>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-[#FFEBEE] text-[#C62828] text-xs font-medium border border-[#FFCDD2]">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            {step === "send" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787] size={16}" />
                    <Input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="seller@store.com or +91 98765 43210"
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Send Reset Link
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <Mail size={40} className="mx-auto text-[#2874F0] mb-3" />
                <p className="text-sm font-medium text-[#212121] mb-1">
                  Reset link sent
                </p>
                <p className="text-xs text-[#878787] mb-4">
                  Check your email or SMS for instructions to reset your password.
                </p>
                <Button variant="outline" onClick={() => router.push("/seller/login")} className="w-auto">
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
