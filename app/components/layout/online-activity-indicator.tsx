"use client";

import { useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import { toastFill } from "@/app/lib/toast-style";

export function OnlineActivityIndicator() {
  const [hasServerResponse, setHasServerResponse] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.ok) {
        setHasServerResponse(true);
        setIsPulsing(true);

        if (pulseTimerRef.current) {
          clearTimeout(pulseTimerRef.current);
        }

        pulseTimerRef.current = setTimeout(() => {
          setIsPulsing(false);
        }, 900);
      }

      return response;
    };

    const ping = () => {
      fetch("/api/ping", { cache: "no-store" }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 20_000);

    return () => {
      window.fetch = originalFetch;
      clearInterval(interval);
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    sileo.success({
      title: "Server Activity",
      fill: toastFill(),
      description: hasServerResponse
        ? "If you are able to read this it means the server should be runnin!"
        : "Oh no, is it down :(",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mr-1 p-2 hover:bg-secondary/50 rounded-full transition-colors cursor-pointer"
      aria-label="Show server activity status"
      title="Server activity"
    >
      <span className="flex h-5 items-end gap-1">
        <span
          className={`w-1.5 rounded-sm transition-all duration-300 ${
            hasServerResponse ? "bg-emerald-500" : "bg-emerald-500/30"
          } ${isPulsing ? "h-2.5" : "h-2"}`}
        />
        <span
          className={`w-1.5 rounded-sm transition-all duration-300 ${
            hasServerResponse ? "bg-emerald-500" : "bg-emerald-500/30"
          } ${isPulsing ? "h-[18px]" : "h-4"}`}
        />
        <span
          className={`w-1.5 rounded-sm transition-all duration-300 ${
            hasServerResponse ? "bg-emerald-500" : "bg-emerald-500/30"
          } ${isPulsing ? "h-[14px]" : "h-3"}`}
        />
      </span>
    </button>
  );
}
