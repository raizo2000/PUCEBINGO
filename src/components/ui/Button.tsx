"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30",
  secondary:
    "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
  danger: "bg-rose-600 hover:bg-rose-500 text-white",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white",
  ghost: "bg-transparent hover:bg-white/10 text-slate-200 border border-slate-600",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-6 py-3 text-lg rounded-xl font-semibold",
  xl: "px-8 py-4 text-xl rounded-2xl font-bold min-h-[56px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900",
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
