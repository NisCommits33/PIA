import Image from "next/image";

import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      aria-hidden="true"
      className={cn("block", className)}
      alt=""
      height={128}
      src="/pia-arff-logo.png"
      width={128}
    />
  );
}
