"use client";

import Image from "next/image";
import { getZoneLogo } from "@/app/lib/utils";

interface ZoneLogoProps {
  zoneId: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ZoneLogo({ zoneId, width = 24, height = 24, className }: ZoneLogoProps) {
  const src = getZoneLogo(zoneId);
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={zoneId}
      width={width}
      height={height}
      className={className}
    />
  );
}
