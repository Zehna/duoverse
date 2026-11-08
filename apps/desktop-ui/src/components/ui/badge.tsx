import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border border-zinc-800 bg-zinc-950/80 text-zinc-300",
        secondary:
          "border border-zinc-700/60 bg-zinc-800 text-zinc-200",
        destructive:
          "border border-rose-500/30 bg-rose-500/10 text-rose-400",
        outline: "text-zinc-300 border border-zinc-800",
        online:
          "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        active:
          "border border-sky-500/30 bg-sky-500/10 text-sky-400",
        warning:
          "border border-amber-500/30 bg-amber-500/10 text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
