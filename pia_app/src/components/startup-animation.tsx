"use client";

import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand-mark";

let hasPlayedStartupAnimation = false;

function isStandalonePwa() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function StartupAnimation() {
  const [visible, setVisible] = useState(
    () => !hasPlayedStartupAnimation && isStandalonePwa(),
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    hasPlayedStartupAnimation = true;

    const timeout = window.setTimeout(() => setVisible(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-label="Opening PIA ARFF"
      className="startup-screen fixed inset-0 z-50 grid place-items-center bg-background"
      role="status"
    >
      <div className="startup-mark">
        <div className="startup-glow" aria-hidden="true" />
        <BrandMark className="startup-logo" />
        <div className="startup-sheen" aria-hidden="true" />
      </div>
      <div className="startup-title">PIA ARFF</div>
    </div>
  );
}
