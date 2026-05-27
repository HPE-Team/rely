"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getZoneLogo, getZoneLogoLight } from "@/app/lib/utils";

interface ZoneLogoProps {
  zoneId: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ZoneLogo({ zoneId, width = 24, height = 24, className }: ZoneLogoProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const src = isDark ? getZoneLogo(zoneId) : getZoneLogoLight(zoneId);
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
