"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const supportTicketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  orderId: z.string().optional(),
});

type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;

interface SupportTicketFormProps {
  onSubmit: (values: SupportTicketFormValues) => void;
  isLoading?: boolean;
  className?: string;
}

export function SupportTicketForm({ onSubmit, isLoading = false, className }: SupportTicketFormProps) {
  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      subject: "",
      message: "",
      priority: "MEDIUM",
      orderId: "",
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Subject</label>
        <Input {...form.register("subject")} placeholder="e.g. Payout delay for October" />
        {form.formState.errors.subject && (
          <p className="text-[10px] text-[#E53935]">{form.formState.errors.subject.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Message</label>
        <Textarea {...form.register("message")} rows={4} placeholder="Describe your issue..." />
        {form.formState.errors.message && (
          <p className="text-[10px] text-[#E53935]">{form.formState.errors.message.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Order ID (Optional)</label>
        <Input {...form.register("orderId")} placeholder="e.g. ORD26100101" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Priority</label>
        <select
          {...form.register("priority")}
          className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>
      <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
        Submit Ticket
      </Button>
    </form>
  );
}
