import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "cyan" | "blue" | "violet" | "amber" | "default";
  className?: string;
}

const variantStyles: Record<string, string> = {
  cyan: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20",
  blue: "bg-accent-blue/10 text-accent-blue border-accent-blue/20",
  violet: "bg-accent-violet/10 text-accent-violet border-accent-violet/20",
  amber: "bg-accent-amber/10 text-accent-amber border-accent-amber/20",
  default: "bg-bg-tertiary text-text-secondary border-border-subtle",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
