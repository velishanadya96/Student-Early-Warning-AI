import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-5 py-3",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: Props) {
  return <button type={type} className={buttonVariants({ variant, size, className })} {...props} />;
}