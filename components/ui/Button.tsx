import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white shadow-[0_12px_24px_-14px_rgba(2,16,36,0.8)] hover:bg-blue-700",
        secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "px-3.5 py-2 text-sm",
        md: "px-4.5 py-2.5 text-sm",
        lg: "px-5 py-3.5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: Props) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
