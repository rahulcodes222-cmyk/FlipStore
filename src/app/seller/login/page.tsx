"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Mail as MailIcon,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerAuthService } from "@/services";
import { useHydration } from "@/hooks/useHydration";
import { cn } from "@/lib/utils";

export default function SellerLoginPage() {
  const router = useRouter();
  const { setSeller, isAuthenticated } = useSellerStore();
  const isHydrated = useHydration();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/seller/dashboard");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (isHydrated && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F3F6] px-4">
        <div className="w-6 h-6 border-2 border-[#2874F0] border-t-transparent rounded-full animate-spin" aria-label="Redirecting" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { seller } = await sellerAuthService.loginWithPassword(identifier, password);
      setSeller(seller);
      router.push("/seller/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F3F6] px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-2">
          <Store size={24} className="text-[#2874F0]" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg tracking-tight text-[#212121]">FlipStore</span>
            <span className="text-[#ffe500] text-xs font-bold uppercase tracking-wider">Seller Hub</span>
          </div>
        </div>

        <Card className="mt-6 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-lg">Seller Login</CardTitle>
            <p className="text-center text-xs text-[#878787] mt-1">
              Manage your store and grow your business
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-[#FFEBEE] text-[#C62828] text-xs font-medium border border-[#FFCDD2]">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787] size={16}" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#878787] hover:text-[#2874F0]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#212121]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-sm text-[#2874F0] focus:ring-[#2874F0]"
                  />
                  <span>Remember me</span>
                </label>
                <Link
                  href="/seller/forgot-password"
                  className="text-[#2874F0] font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full"
              >
                Login to Seller Hub
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#878787] mt-6">
          Don&apos;t have a seller account?{" "}
          <Link href="/seller/register" className="text-[#2874F0] font-medium hover:underline">
            Register as a seller
          </Link>
        </p>
      </div>
    </div>
  );
}
