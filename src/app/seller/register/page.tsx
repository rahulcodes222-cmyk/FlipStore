"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Mail,
  Phone,
  Lock,
  Building2,
  MapPin,
  FileText,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Store,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sellerAuthService } from "@/services";
import { EMPTY_REGISTER_PAYLOAD } from "@/data";
import { cn } from "@/lib/utils";

const step1Schema = z.object({
  fullName: z.string().trim()
    .min(2, "Full name must be at least 2 characters")
    .max(60, "Full name is too long")
    .regex(/^[A-Za-z][A-Za-z\s.'-]*$/, "Enter a valid full name (letters and spaces only)"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  businessName: z.string().trim()
    .min(2, "Business name required")
    .max(100, "Business name is too long")
    .regex(/^[A-Za-z0-9][A-Za-z0-9\s&.,'()\/-]*$/, "Enter a valid business name"),
  businessType: z.string().min(1, "Select a business type"),
  businessDescription: z.string().trim().min(10, "Description must be at least 10 characters").max(1000, "Description is too long"),
  businessEmail: z.string().trim().toLowerCase().email("Invalid business email"),
  businessPhone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit business phone number"),
});

const step3Schema = z.object({
  houseNumber: z.string().trim()
    .min(1, "House number required")
    .max(30, "House number is too long")
    .regex(/^[A-Za-z0-9\s\/,#().-]+$/, "Enter a valid house/flat number"),
  street: z.string().trim()
    .min(2, "Street/locality required")
    .max(120, "Street is too long")
    .regex(/^[A-Za-z0-9\s\/,#().'-]+$/, "Enter a valid street/locality"),
  city: z.string().trim()
    .min(2, "City required")
    .max(60, "City name is too long")
    .regex(/^[A-Za-z][A-Za-z\s.'-]*$/, "Enter a valid city name"),
  state: z.string().trim()
    .min(2, "State required")
    .max(60, "State name is too long")
    .regex(/^[A-Za-z][A-Za-z\s.'-]*$/, "Enter a valid state name"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  country: z.string().trim().min(1, "Country required"),
});

const step4Schema = z.object({
  panNumber: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter a valid PAN number (e.g. ABCDE1234F)"),
  gstNumber: z.string().trim().toUpperCase().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Enter a valid GSTIN (15 characters)"),
  businessRegistration: z.string().trim()
    .min(5, "Business registration details required")
    .max(30, "Registration details are too long")
    .regex(/^[A-Za-z0-9\s\/-]+$/, "Enter valid business registration details (letters, numbers, - or /)"),
});

const step5Schema = z.object({
  accountHolderName: z.string().trim()
    .min(2, "Account holder name required")
    .max(60, "Name is too long")
    .regex(/^[A-Za-z][A-Za-z\s.'-]*$/, "Enter a valid account holder name"),
  bankName: z.string().trim()
    .min(2, "Bank name required")
    .max(80, "Bank name is too long")
    .regex(/^[A-Za-z][A-Za-z0-9\s&.,'()-]*$/, "Enter a valid bank name"),
  accountNumber: z.string().regex(/^\d{9,18}$/, "Enter a valid bank account number (9-18 digits)"),
  ifscCode: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code (e.g. HDFC0001234)"),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;
type Step4 = z.infer<typeof step4Schema>;
type Step5 = z.infer<typeof step5Schema>;

const STEPS = [
  { key: "step1", label: "Personal Information" },
  { key: "step2", label: "Business Information" },
  { key: "step3", label: "Business Address" },
  { key: "step4", label: "Documents" },
  { key: "step5", label: "Bank Details" },
  { key: "step6", label: "Review & Submit" },
];

export default function SellerRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), mode: "onBlur", defaultValues: EMPTY_REGISTER_PAYLOAD.step1 });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), mode: "onBlur", defaultValues: EMPTY_REGISTER_PAYLOAD.step2 });
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), mode: "onBlur", defaultValues: EMPTY_REGISTER_PAYLOAD.step3 });
  const form4 = useForm<Step4>({ resolver: zodResolver(step4Schema), mode: "onBlur", defaultValues: EMPTY_REGISTER_PAYLOAD.step4 });
  const form5 = useForm<Step5>({ resolver: zodResolver(step5Schema), mode: "onBlur", defaultValues: EMPTY_REGISTER_PAYLOAD.step5 });

  const nextStep = async () => {
    let valid = true;
    if (currentStep === 0) valid = await form1.trigger();
    else if (currentStep === 1) valid = await form2.trigger();
    else if (currentStep === 2) valid = await form3.trigger();
    else if (currentStep === 3) valid = await form4.trigger();
    else if (currentStep === 4) valid = await form5.trigger();
    if (!valid) return;
    setError("");
    setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1));
  };

  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // validate all steps before submit
    const ok = (await form1.trigger()) && (await form2.trigger()) && (await form3.trigger()) && (await form4.trigger()) && (await form5.trigger());
    if (!ok) {
      setError("Please fix validation errors in previous steps before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        step1: form1.getValues(),
        step2: form2.getValues(),
        step3: form3.getValues(),
        step4: { ...form4.getValues(), identityPreview },
        step5: form5.getValues(),
      };
      await sellerAuthService.register(payload);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((currentStep) / (STEPS.length - 1)) * 100;

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F3F6] px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <Store size={24} className="text-[#2874F0]" />
            <span className="font-bold text-lg tracking-tight text-[#212121]">FlipStore</span>
          </div>
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-[#2E7D32]" />
              </div>
              <CardTitle className="text-lg">Registration Successful</CardTitle>
              <p className="text-sm text-[#878787] mt-2">
                Your seller application has been submitted for review. Dashboard access will be enabled after admin approval.
              </p>
              <Button variant="primary" onClick={() => router.push("/seller/login")} className="w-auto mt-6">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F3F6] px-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Store size={24} className="text-[#2874F0]" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg tracking-tight text-[#212121]">FlipStore</span>
            <span className="text-[#ffe500] text-xs font-bold uppercase tracking-wider">Seller Hub</span>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Seller Registration</CardTitle>
            <div className="mt-3 h-1.5 w-full bg-[#E0E0E0] rounded-full overflow-hidden">
              <div className={`h-full bg-[#2874F0] transition-all duration-300`} style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-[#878787] font-bold uppercase tracking-wider">
              {STEPS.map((s, i) => (
                <span key={s.key} className={cn(i === currentStep ? "text-[#2874F0]" : "text-[#B0B0B0]")}>
                  {s.label}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="min-h-[420px] sm:h-[520px] overflow-y-auto sm:overflow-hidden relative">
              {currentStep === 0 && <Step1Form form={form1} />}
              {currentStep === 1 && <Step2Form form={form2} />}
              {currentStep === 2 && <Step3Form form={form3} />}
              {currentStep === 3 && <Step4Form form={form4} onImageChange={setIdentityPreview} preview={identityPreview} />}
              {currentStep === 4 && <Step5Form form={form5} />}
              {currentStep === 5 && <Step6Form form1={form1} form2={form2} form3={form3} form4={form4} form5={form5} />}
            </div>
            <div className="border-t border-[#F0F0F0] p-4 bg-[#F9FAFB] flex items-center justify-between">
              {currentStep > 0 && (
                <Button variant="outline" onClick={prevStep} leftIcon={<ChevronLeft size={16} />}>
                  Back
                </Button>
              )}
              <div className="text-[10px] text-[#878787] font-medium">
                Step {currentStep + 1} of {STEPS.length}
              </div>
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={nextStep} className="ml-auto">
                  Next <ChevronRight size={16} />
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
                  Submit Application
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-sm bg-[#FFEBEE] text-[#C62828] text-xs font-medium border border-[#FFCDD2] max-w-md mx-auto">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function Step1Form({ form }: { form: ReturnType<typeof useForm<Step1>> }) {
  const { register, setValue, formState: { errors } } = form;
  return (
    <div className="p-8 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Full Name</label>
        <Input
          {...register("fullName")}
          placeholder="Rahul Sharma"
          maxLength={60}
          onChange={(e) => setValue("fullName", e.target.value.replace(/[^A-Za-z\s.'-]/g, ""), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.fullName && <p className="text-[10px] text-[#E53935]">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Email</label>
        <Input
          {...register("email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="rahul@store.com"
          maxLength={100}
          onChange={(e) => setValue("email", e.target.value.replace(/\s/g, ""), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.email && <p className="text-[10px] text-[#E53935]">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Mobile Number</label>
        <Input
          {...register("mobile")}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9876543210"
          maxLength={10}
          onChange={(e) => setValue("mobile", e.target.value.replace(/\D/g, "").slice(0, 10), { shouldValidate: true, shouldDirty: true })}
        />
        <p className="text-[10px] text-[#878787]">Enter 10-digit mobile number (digits only).</p>
        {errors.mobile && <p className="text-[10px] text-[#E53935]">{errors.mobile.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Password</label>
        <Input {...register("password")} type="password" autoComplete="new-password" placeholder="••••••••" maxLength={128} />
        {errors.password && <p className="text-[10px] text-[#E53935]">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Confirm Password</label>
        <Input {...register("confirmPassword")} type="password" autoComplete="new-password" placeholder="••••••••" maxLength={128} />
        {errors.confirmPassword && <p className="text-[10px] text-[#E53935]">{errors.confirmPassword.message}</p>}
      </div>
    </div>
  );
}

function Step2Form({ form }: { form: ReturnType<typeof useForm<Step2>> }) {
  const { register, setValue, formState: { errors } } = form;
  const businessTypes = ["Proprietorship", "Partnership", "Private Limited", "LLP", "Public Limited"];
  return (
    <div className="p-8 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Name</label>
        <Input
          {...register("businessName")}
          placeholder="ElectroHub India"
          maxLength={100}
          onChange={(e) => setValue("businessName", e.target.value.replace(/[^A-Za-z0-9\s&.,'()\/-]/g, ""), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.businessName && <p className="text-[10px] text-[#E53935]">{errors.businessName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Type</label>
        <select {...register("businessType")} className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]">
          <option value="">Select business type</option>
          {businessTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.businessType && <p className="text-[10px] text-[#E53935]">{errors.businessType.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Description</label>
        <textarea
          {...register("businessDescription")}
          rows={3}
          maxLength={1000}
          className="flex h-24 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
          placeholder="Describe your business..."
        />
        {errors.businessDescription && <p className="text-[10px] text-[#E53935]">{errors.businessDescription.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Email</label>
        <Input
          {...register("businessEmail")}
          type="email"
          inputMode="email"
          placeholder="contact@store.com"
          maxLength={100}
          onChange={(e) => setValue("businessEmail", e.target.value.replace(/\s/g, ""), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.businessEmail && <p className="text-[10px] text-[#E53935]">{errors.businessEmail.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Phone</label>
        <Input
          {...register("businessPhone")}
          type="tel"
          inputMode="numeric"
          placeholder="9876543210"
          maxLength={10}
          onChange={(e) => setValue("businessPhone", e.target.value.replace(/\D/g, "").slice(0, 10), { shouldValidate: true, shouldDirty: true })}
        />
        <p className="text-[10px] text-[#878787]">Enter 10-digit phone number (digits only).</p>
        {errors.businessPhone && <p className="text-[10px] text-[#E53935]">{errors.businessPhone.message}</p>}
      </div>
    </div>
  );
}

function Step3Form({ form }: { form: ReturnType<typeof useForm<Step3>> }) {
  const { register, setValue, formState: { errors } } = form;
  return (
    <div className="p-8 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">House Number</label>
          <Input
            {...register("houseNumber")}
            placeholder="402"
            maxLength={30}
            onChange={(e) => setValue("houseNumber", e.target.value.replace(/[^A-Za-z0-9\s\/,#().-]/g, ""), { shouldValidate: true, shouldDirty: true })}
          />
          {errors.houseNumber && <p className="text-[10px] text-[#E53935]">{errors.houseNumber.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Street</label>
          <Input
            {...register("street")}
            placeholder="17th Main Road"
            maxLength={120}
            onChange={(e) => setValue("street", e.target.value.replace(/[^A-Za-z0-9\s\/,#().'-]/g, ""), { shouldValidate: true, shouldDirty: true })}
          />
          {errors.street && <p className="text-[10px] text-[#E53935]">{errors.street.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">City</label>
          <Input
            {...register("city")}
            placeholder="Bengaluru"
            maxLength={60}
            onChange={(e) => setValue("city", e.target.value.replace(/[^A-Za-z\s.'-]/g, ""), { shouldValidate: true, shouldDirty: true })}
          />
          {errors.city && <p className="text-[10px] text-[#E53935]">{errors.city.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">State</label>
          <Input
            {...register("state")}
            placeholder="Karnataka"
            maxLength={60}
            onChange={(e) => setValue("state", e.target.value.replace(/[^A-Za-z\s.'-]/g, ""), { shouldValidate: true, shouldDirty: true })}
          />
          {errors.state && <p className="text-[10px] text-[#E53935]">{errors.state.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">PIN Code</label>
          <Input
            {...register("pincode")}
            type="tel"
            inputMode="numeric"
            placeholder="560034"
            maxLength={6}
            onChange={(e) => setValue("pincode", e.target.value.replace(/\D/g, "").slice(0, 6), { shouldValidate: true, shouldDirty: true })}
          />
          <p className="text-[10px] text-[#878787]">6-digit PIN code (digits only).</p>
          {errors.pincode && <p className="text-[10px] text-[#E53935]">{errors.pincode.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Country</label>
          <Input {...register("country")} defaultValue="India" readOnly />
        </div>
      </div>
    </div>
  );
}

function Step4Form({ form, onImageChange, preview }: { form: ReturnType<typeof useForm<Step4>>; onImageChange: (v: string | null) => void; preview: string | null }) {
  const { register, setValue, formState: { errors } } = form;
  return (
    <div className="p-8 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">PAN Card Number</label>
        <Input
          {...register("panNumber")}
          placeholder="ABCDE1234F"
          maxLength={10}
          onChange={(e) => setValue("panNumber", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.panNumber && <p className="text-[10px] text-[#E53935]">{errors.panNumber.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">GST Number</label>
        <Input
          {...register("gstNumber")}
          placeholder="29ABCDE1234F1Z5"
          maxLength={15}
          onChange={(e) => setValue("gstNumber", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.gstNumber && <p className="text-[10px] text-[#E53935]">{errors.gstNumber.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Registration Details</label>
        <Input
          {...register("businessRegistration")}
          placeholder="CIN U52100KA2020PTC123456"
          maxLength={30}
          onChange={(e) => setValue("businessRegistration", e.target.value.toUpperCase().replace(/[^A-Z0-9\s\/-]/g, "").slice(0, 30), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.businessRegistration && <p className="text-[10px] text-[#E53935]">{errors.businessRegistration.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Identity Verification Upload</label>
        <div className="flex flex-col items-center gap-3">
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#E0E0E0] bg-[#F9FAFB] flex items-center justify-center relative overflow-hidden group">
            {preview ? (
              <img src={preview} alt="Identity" className="w-full h-full object-cover" />
            ) : (
              <FileText size={24} className="text-[#878787]" />
            )}
            <input
              id="id-file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageChange(URL.createObjectURL(file));
              }}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => (document.getElementById("id-file") as HTMLInputElement).click()}
              className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              Upload
            </button>
          </div>
          <p className="text-xs text-[#878787] text-center">
            Mock upload only. No real documents are stored.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step5Form({ form }: { form: ReturnType<typeof useForm<Step5>> }) {
  const { register, setValue, formState: { errors } } = form;
  return (
    <div className="p-8 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Account Holder Name</label>
        <Input
          {...register("accountHolderName")}
          placeholder="Rahul Sharma"
          maxLength={60}
          onChange={(e) => setValue("accountHolderName", e.target.value.replace(/[^A-Za-z\s.'-]/g, ""), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.accountHolderName && <p className="text-[10px] text-[#E53935]">{errors.accountHolderName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Bank Name</label>
        <Input
          {...register("bankName")}
          placeholder="HDFC Bank"
          maxLength={80}
          onChange={(e) => setValue("bankName", e.target.value.replace(/[^A-Za-z0-9\s&.,'()-]/g, ""), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.bankName && <p className="text-[10px] text-[#E53935]">{errors.bankName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Account Number</label>
        <Input
          {...register("accountNumber")}
          type="tel"
          inputMode="numeric"
          placeholder="50100123456789"
          maxLength={18}
          onChange={(e) => setValue("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 18), { shouldValidate: true, shouldDirty: true })}
        />
        <p className="text-[10px] text-[#878787]">Digits only (9-18 digits).</p>
        {errors.accountNumber && <p className="text-[10px] text-[#E53935]">{errors.accountNumber.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">IFSC Code</label>
        <Input
          {...register("ifscCode")}
          placeholder="HDFC0001234"
          maxLength={11}
          onChange={(e) => setValue("ifscCode", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11), { shouldValidate: true, shouldDirty: true })}
        />
        {errors.ifscCode && <p className="text-[10px] text-[#E53935]">{errors.ifscCode.message}</p>}
      </div>
      <p className="text-xs text-[#878787] text-center">
        Bank details are simulated only. No real banking data is stored.
      </p>
    </div>
  );
}

function Step6Form({ form1, form2, form3, form4, form5 }: {
  form1: ReturnType<typeof useForm<Step1>>;
  form2: ReturnType<typeof useForm<Step2>>;
  form3: ReturnType<typeof useForm<Step3>>;
  form4: ReturnType<typeof useForm<Step4>>;
  form5: ReturnType<typeof useForm<Step5>>;
}) {
  return (
    <div className="p-8 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#F9FAFB] rounded-sm p-3 border border-[#F0F0F0]">
          <p className="text-[10px] font-bold text-[#878787] uppercase mb-1">Full Name</p>
          <p className="text-sm text-[#212121]">{form1.getValues("fullName")}</p>
        </div>
        <div className="bg-[#F9FAFB] rounded-sm p-3 border border-[#F0F0F0]">
          <p className="text-[10px] font-bold text-[#878787] uppercase mb-1">Email</p>
          <p className="text-sm text-[#212121]">{form1.getValues("email")}</p>
        </div>
        <div className="bg-[#F9FAFB] rounded-sm p-3 border border-[#F0F0F0]">
          <p className="text-[10px] font-bold text-[#878787] uppercase mb-1">Mobile</p>
          <p className="text-sm text-[#212121]">{form1.getValues("mobile")}</p>
        </div>
        <div className="bg-[#F9FAFB] rounded-sm p-3 border border-[#F0F0F0]">
          <p className="text-[10px] font-bold text-[#878787] uppercase mb-1">Business Name</p>
          <p className="text-sm text-[#212121]">{form2.getValues("businessName")}</p>
        </div>
        <div className="bg-[#F9FAFB] rounded-sm p-3 border border-[#F0F0F0]">
          <p className="text-[10px] font-bold text-[#878787] uppercase mb-1">Business Type</p>
          <p className="text-sm text-[#212121]">{form2.getValues("businessType")}</p>
        </div>
        <div className="md:col-span-2 bg-[#F9FAFB] rounded-sm p-3 border border-[#F0F0F0]">
          <p className="text-[10px] font-bold text-[#878787] uppercase mb-1">PAN</p>
          <p className="text-sm text-[#212121]">{form4.getValues("panNumber")}</p>
          <p className="text-[10px] font-bold text-[#878787] uppercase mt-1 mb-0">GST</p>
          <p className="text-sm text-[#212121]">{form4.getValues("gstNumber")}</p>
        </div>
      </div>
      <div className="pt-4 border-t border-[#F0F0F0]">
        <p className="text-[10px] font-bold text-[#878787] uppercase mb-2">Verification Status</p>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-[#B26A00] bg-[#FFF8E1] border border-[#FFE082]">
          Pending
        </span>
        <p className="text-xs text-[#878787] mt-1">
          Your application is under review. You will receive an email once verified.
        </p>
      </div>
    </div>
  );
}
