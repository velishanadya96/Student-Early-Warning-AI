import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", {
  variants: {
    variant: {
      low: "bg-emerald-100 text-emerald-700",
      medium: "bg-amber-100 text-amber-700",
      high: "bg-red-100 text-red-700",
      neutral: "bg-slate-100 text-slate-700",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({ variant, children }: VariantProps<typeof badgeVariants> & { children: React.ReactNode }) {
  return (
    <span className={badgeVariants({ variant })}>
      {variant && variant !== "neutral" && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
