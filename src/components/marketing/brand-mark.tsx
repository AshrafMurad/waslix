import { BrandLogo } from "@/components/brand-logo";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return <BrandLogo className={`marketing-brand-logo ${className ?? ""}`} />;
}
