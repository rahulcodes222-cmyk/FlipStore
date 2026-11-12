"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SearchInput({
  value: controlledValue,
  defaultValue = "",
  placeholder = "Search for products, brands and more",
  onSearch,
  onChange,
  suggestions = [],
  onSelectSuggestion,
  isLoading = false,
  size = "md",
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledValue !== undefined;
  const query = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e);
    if (!isOpen && e.target.value.trim().length > 0) setIsOpen(true);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    const syntheticEvent = {
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange?.(syntheticEvent);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center w-full bg-white rounded-sm border border-[#E0E0E0] shadow-2xs focus-within:border-[#2874F0] focus-within:ring-1 focus-within:ring-[#2874F0] overflow-hidden transition-all",
          sizeClasses[size]
        )}
      >
        <div className="pl-3 pr-2 text-gray-400 flex items-center">
          {isLoading ? (
            <Loader2 className="animate-spin text-[#2874F0]" size={18} />
          ) : (
            <Search size={18} className="text-[#2874F0]" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim().length > 0 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-2 py-1 text-[#212121] placeholder:text-[#878787] outline-none"
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        <button
          type="submit"
          className="h-full px-4 bg-[#2874F0] text-white font-medium hover:bg-[#1259c7] transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Submit search"
        >
          <Search size={16} className="text-white" />
        </button>
      </form>

      {/* Auto Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0E0E0] rounded-sm shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in-50 slide-in-from-top-1">
          <ul className="py-1">
            {suggestions.map((suggestion, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectSuggestion?.(suggestion);
                    if (!isControlled) setInternalValue(suggestion);
                    setIsOpen(false);
                    onSearch?.(suggestion);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm text-[#212121] hover:bg-[#F1F3F6] hover:text-[#2874F0] transition-colors"
                >
                  <Search size={14} className="text-gray-400" />
                  <span>{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
