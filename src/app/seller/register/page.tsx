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
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  businessName: z.string().min(2, "Business name required"),
  businessType: z.string().min(1, "Select a business type"),
  businessDescription: z.string().min(10, "Description must be at least 10 characters"),
  businessEmail: z.string().email("Invalid business email"),
  businessPhone: z.string().min(10, "Enter a valid business phone"),
});

const step3Schema = z.object({
  houseNumber: z.string().min(1, "House number required"),
  street: z.string().min(1, "Street required"),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  pincode: z.string().length(6, "Enter a valid 6-digit PIN code"),
  country: z.string().min(1, "Country required"),
});

const step4Schema = z.object({
  panNumber: z.string().min(1, "PAN number required"),
  gstNumber: z.string().min(1, "GST number required"),
  businessRegistration: z.string().min(1, "Business registration required"),
});

const step5Schema = z.object({
  accountHolderName: z.string().min(2, "Account holder name required"),
  bankName: z.string().min(1, "Bank name required"),
  accountNumber: z.string().min(9, "Enter a valid account number"),
  ifscCode: z.string().min(1, "IFSC code required"),
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
              {currentStep === 5 && <Step6Form
                form1={form1} form2={form2} form3={form3} form4={form4} form5={form5}
              />}
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
  const { register, control, formState: { errors } } = form;
  return (
    <div className="p-8 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Full Name</label>
        <Input {...register("fullName")} placeholder="Rahul Sharma" />
        {errors.fullName && <p className="text-[10px] text-[#E53935]">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Email</label>
        <Input {...register("email")} type="email" placeholder="rahul@store.com" />
        {errors.email && <p className="text-[10px] text-[#E53935]">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Mobile Number</label>
        <Input {...register("mobile")} placeholder="+91 98765 43210" />
        {errors.mobile && <p className="text-[10px] text-[#E53935]">{errors.mobile.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Password</label>
        <Input {...register("password")} type="password" placeholder="••••••••" />
        {errors.password && <p className="text-[10px] text-[#E53935]">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Confirm Password</label>
        <Input {...register("confirmPassword")} type="password" placeholder="••••••••" />
        {errors.confirmPassword && <p className="text-[10px] text-[#E53935]">{errors.confirmPassword.message}</p>}
      </div>
    </div>
  );
}

function Step2Form({ form }: { form: ReturnType<typeof useForm<Step2>> }) {
  const { register, formState: { errors } } = form;
  const businessTypes = ["Proprietorship", "Partnership", "Private Limited", "LLP", "Public Limited"];
  return (
    <div className="p-8 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Name</label>
        <Input {...register("businessName")} placeholder="ElectroHub India" />
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
          className="flex h-24 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
          placeholder="Describe your business..."
        />
        {errors.businessDescription && <p className="text-[10px] text-[#E53935]">{errors.businessDescription.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Email</label>
        <Input {...register("businessEmail")} type="email" placeholder="contact@store.com" />
        {errors.businessEmail && <p className="text-[10px] text-[#E53935]">{errors.businessEmail.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Phone</label>
        <Input {...register("businessPhone")} placeholder="+91 98765 43210" />
        {errors.businessPhone && <p className="text-[10px] text-[#E53935]">{errors.businessPhone.message}</p>}
      </div>
    </div>
  );
}

function Step3Form({ form }: { form: ReturnType<typeof useForm<Step3>> }) {
  const { register, formState: { errors } } = form;
  return (
    <div className="p-8 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">House Number</label>
          <Input {...register("houseNumber")} placeholder="402" />
          {errors.houseNumber && <p className="text-[10px] text-[#E53935]">{errors.houseNumber.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Street</label>
          <Input {...register("street")} placeholder="17th Main Road" />
          {errors.street && <p className="text-[10px] text-[#E53935]">{errors.street.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">City</label>
          <Input {...register("city")} placeholder="Bengaluru" />
          {errors.city && <p className="text-[10px] text-[#E53935]">{errors.city.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">State</label>
          <Input {...register("state")} placeholder="Karnataka" />
          {errors.state && <p className="text-[10px] text-[#E53935]">{errors.state.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">PIN Code</label>
          <Input {...register("pincode")} placeholder="560034" maxLength={6} />
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
  const { register, formState: { errors } } = form;
  return (
    <div className="p-8 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">PAN Card Number</label>
        <Input {...register("panNumber")} placeholder="ABCDE1234F" />
        {errors.panNumber && <p className="text-[10px] text-[#E53935]">{errors.panNumber.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">GST Number</label>
        <Input {...register("gstNumber")} placeholder="29ABCDE1234F1Z5" />
        {errors.gstNumber && <p className="text-[10px] text-[#E53935]">{errors.gstNumber.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Registration Details</label>
        <Input {...register("businessRegistration")} placeholder="CIN U52100KA2020PTC123456" />
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
  const { register, formState: { errors } } = form;
  return (
    <div className="p-8 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Account Holder Name</label>
        <Input {...register("accountHolderName")} placeholder="Rahul Sharma" />
        {errors.accountHolderName && <p className="text-[10px] text-[#E53935]">{errors.accountHolderName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Bank Name</label>
        <Input {...register("bankName")} placeholder="HDFC Bank" />
        {errors.bankName && <p className="text-[10px] text-[#E53935]">{errors.bankName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Account Number</label>
        <Input {...register("accountNumber")} placeholder="50100123456789" />
        {errors.accountNumber && <p className="text-[10px] text-[#E53935]">{errors.accountNumber.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">IFSC Code</label>
        <Input {...register("ifscCode")} placeholder="HDFC0001234" />
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
