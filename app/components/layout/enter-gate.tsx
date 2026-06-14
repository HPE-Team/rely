"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function EnterGate() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("rely-entered") === "1") {
      setVisible(false);
      return;
    }
    // Single rAF so first paint is opacity-0 and transition fires immediately after
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleEnter() {
    localStorage.setItem("rely-entered", "1");
    setFading(true);
    setTimeout(() => setVisible(false), 500);
  }

  if (!visible) return null;

  const fadeUp = (delay: number) =>
    ({
      transitionDelay: `${delay}ms`,
      transitionProperty: "opacity, transform",
      transitionDuration: "700ms",
      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(10px)",
    }) as React.CSSProperties;

  return (
    <div
      className="enter-gate fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background"
      style={{
        transition: "opacity 500ms ease, transform 500ms ease",
        opacity: fading ? 0 : 1,
        transform: fading ? "scale(1.015)" : "scale(1)",
      }}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklch, var(--brand) 18%, transparent) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Radial vignette — fades dot grid at edges */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 65% at 50% 50%, transparent 20%, var(--background) 80%)",
        }}
      />

      {/* Content stack */}
      <div className="relative flex flex-col items-center gap-9">
        {/* Logo + glow */}
        <div style={fadeUp(60)} className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full"
            style={{
              width: "80px",
              height: "80px",
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--brand) 30%, transparent) 0%, transparent 70%)",
              filter: "blur(18px)",
              transform: "scale(1.8)",
            }}
          />
          <Image
            src="/logo.svg"
            alt="Rely"
            width={52}
            height={52}
            className="relative"
          />
        </div>

        {/* Wordmark */}
        <div style={fadeUp(160)} className="flex flex-col items-center gap-3">
          <h1
            className="font-bold text-foreground"
            style={{
              fontSize: "clamp(3rem, 8vw, 5.5rem)",
              letterSpacing: "0.12em",
              lineHeight: 1,
            }}
          >
            REL<span style={{ color: "var(--brand)" }}>Y</span>
          </h1>
          <p
            className="font-mono text-muted-foreground"
            style={{ fontSize: "10px", letterSpacing: "0.28em" }}
          >
            INFRASTRUCTURE · PROVISIONING · RELIABILITY
          </p>
        </div>

        {/* Hairline separator */}
        <div
          style={fadeUp(280)}
          className="flex items-center gap-4 w-full"
        >
          <div className="flex-1 h-px bg-border/50" />
          <div
            className="h-1 w-1 rounded-full"
            style={{ background: "var(--brand)", opacity: 0.5 }}
          />
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Enter button */}
        <div style={fadeUp(380)}>
          <button
            onClick={handleEnter}
            className="group relative font-mono text-sm uppercase"
            style={{
              letterSpacing: "0.22em",
              padding: "0.6rem 2.5rem",
              border: "1px solid color-mix(in oklch, var(--brand) 45%, transparent)",
              color: "var(--brand)",
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              cursor: "pointer",
              transition: "background 200ms ease, border-color 200ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "color-mix(in oklch, var(--brand) 8%, transparent)";
              (e.currentTarget as HTMLElement).style.borderColor =
                "color-mix(in oklch, var(--brand) 70%, transparent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.borderColor =
                "color-mix(in oklch, var(--brand) 45%, transparent)";
            }}
          >
            Enter
          </button>
        </div>

        {/* Build label */}
        <p
          style={{
            ...fadeUp(480),
            fontSize: "9px",
            letterSpacing: "0.25em",
            color: "color-mix(in oklch, var(--muted-foreground) 40%, transparent)",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          HPE CPP · PRI DASHBOARD
        </p>
      </div>
    </div>
  );
}
