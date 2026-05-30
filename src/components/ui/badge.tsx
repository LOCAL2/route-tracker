import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold font-[family-name:var(--font-heading)] tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
        success: "bg-green-500/20 text-green-300 border border-green-500/30",
        destructive: "bg-red-500/20 text-red-300 border border-red-500/30",
        secondary: "bg-gray-700 text-gray-300 border border-gray-600",
        outline: "border border-gray-600 text-gray-300",
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
