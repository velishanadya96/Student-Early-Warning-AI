import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const cardVariants = cva("card p-5 sm:p-6", {
  variants: {
    tone: {
      default: "",
      blue: "",
      red: "!border-red-200/70",
    },
  },
  defaultVariants: { tone: "default" },
});

export function Card({ tone, className, ...props }: HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>) {
  return <div className={cardVariants({ tone, className })} {...props} />;
}
