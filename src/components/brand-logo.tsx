import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      width={1536}
      height={1024}
      alt="Waslix"
      className={cn("block h-auto", className ?? "w-20")}
    />
  );
}
