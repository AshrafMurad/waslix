import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  compact?: boolean;
};

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <span className={cn("marketing-brand", className)} aria-label="Waslix">
      <span className="marketing-brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {!compact && <span className="marketing-brand-word">Waslix</span>}
    </span>
  );
}
