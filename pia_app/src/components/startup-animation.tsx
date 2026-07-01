"use client";

import { useEffect, useState } from "react";

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
      <div className="startup-mark" aria-hidden="true">
        <div className="startup-glow" />
        <div className="startup-flame startup-flame-outer" />
        <div className="startup-flame startup-flame-inner" />
        <div className="startup-flame startup-flame-core" />
        <div className="startup-base" />
      </div>
      <div className="startup-title">PIA ARFF</div>
    </div>
  );
}
