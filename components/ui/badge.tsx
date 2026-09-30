import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "green" | "blue" | "red" | "gray" | "purple";
}

export function Badge({
  className,
  variant = "gold",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    gold: "bg-blue-50 text-blue-700 border border-blue-200 font-semibold",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
    blue: "bg-sky-50 text-sky-700 border border-sky-200 font-semibold",
    red: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
    gray: "bg-slate-100 text-slate-700 border border-slate-200 font-medium",
    purple: "bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
