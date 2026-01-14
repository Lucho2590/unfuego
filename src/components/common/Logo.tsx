import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { width: 140, height: 79 },
  md: { width: 220, height: 124 },
  lg: { width: 550, height: 309 },
};

export function Logo({ className, size = "md" }: LogoProps) {
  const dimensions = sizeMap[size];

  return (
    <Image
      src="/images/logo.svg"
      alt="Un Fuego"
      width={dimensions.width}
      height={dimensions.height}
      className={cn("object-contain", className)}
      priority
    />
  );
}
