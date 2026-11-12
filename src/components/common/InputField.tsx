"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixText?: string;
  suffixText?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      prefixText,
      suffixText,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#212121] uppercase tracking-wider"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* Text Prefix (e.g., +91 for mobile) */}
          {prefixText && (
            <span className="absolute left-3 text-sm font-medium text-gray-500 select-none">
              {prefixText}
            </span>
          )}

          {/* HTML Input */}
          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-sm border bg-white px-3 py-2 text-sm text-[#212121] transition-colors placeholder:text-[#878787] focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60",
              hasError
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
                : "border-[#E0E0E0] focus-visible:border-[#2874F0] focus-visible:ring-[#2874F0]",
              leftIcon ? "pl-9" : "",
              prefixText ? "pl-12" : "",
              rightIcon || hasError ? "pr-9" : "",
              suffixText ? "pr-12" : "",
              className
            )}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {/* Right Icon / Error Icon */}
          {hasError ? (
            <div className="absolute right-3 flex items-center pointer-events-none text-red-500">
              <AlertCircle size={16} />
            </div>
          ) : rightIcon ? (
            <div className="absolute right-3 flex items-center text-gray-400">
              {rightIcon}
            </div>
          ) : suffixText ? (
            <span className="absolute right-3 text-sm text-gray-400 select-none">
              {suffixText}
            </span>
          ) : null}
        </div>

        {/* Error message or helper text */}
        {hasError ? (
          <p id={`${inputId}-error`} className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-[#878787] mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
InputField.displayName = "InputField";
