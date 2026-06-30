"use client";

import { useEffect, useState } from "react";
import { Player } from "@remotion/player";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

let hasPlayedStartupAnimation = false;

function StartupComposition() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({
    frame,
    fps,
    config: {
      damping: 18,
      stiffness: 120,
      mass: 0.9,
    },
  });
  const outro = interpolate(frame, [72, 92], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const time = frame / fps;
  const flicker = Math.sin(time * Math.PI * 7) * 0.04 + Math.sin(time * Math.PI * 13) * 0.025;
  const scale = interpolate(intro, [0, 1], [0.82, 1]);
  const glowScale = 1 + Math.max(0, flicker) * 2.4;
  const flameLean = Math.sin(time * Math.PI * 4) * 2.5;
  const flameRise = Math.sin(time * Math.PI * 6) * -5;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 50% 44%, rgba(251, 146, 60, 0.28) 0%, rgba(254, 243, 199, 0.5) 25%, rgba(239, 246, 255, 0.74) 54%, #f8fafc 100%)",
        color: "#0f172a",
        display: "flex",
        justifyContent: "center",
        opacity: outro,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          opacity: intro,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            height: 150,
            justifyContent: "center",
            position: "relative",
            width: 150,
          }}
        >
          <div
            style={{
              background:
                "radial-gradient(circle, rgba(251, 146, 60, 0.7) 0%, rgba(245, 158, 11, 0.32) 38%, rgba(245, 158, 11, 0) 70%)",
              borderRadius: 999,
              filter: "blur(10px)",
              height: 150,
              opacity: 0.95,
              position: "absolute",
              transform: `scale(${glowScale})`,
              width: 150,
            }}
          />
          <div
            style={{
              background:
                "linear-gradient(180deg, #fed7aa 0%, #f97316 42%, #b45309 100%)",
              borderRadius: "70% 32% 68% 38% / 72% 36% 72% 34%",
              boxShadow:
                "0 0 22px rgba(249, 115, 22, 0.85), 0 0 56px rgba(245, 158, 11, 0.55)",
              height: 104,
              position: "absolute",
              transform: `translateY(${flameRise}px) rotate(${flameLean - 43}deg) scale(${1 + flicker})`,
              width: 86,
            }}
          />
          <div
            style={{
              background:
                "linear-gradient(180deg, #fff7ed 0%, #facc15 40%, #f97316 100%)",
              borderRadius: "72% 28% 66% 34% / 72% 34% 74% 30%",
              filter: "blur(0.2px)",
              height: 70,
              position: "absolute",
              transform: `translateY(${18 + flameRise * 0.65}px) rotate(${flameLean - 38}deg) scale(${0.92 - flicker})`,
              width: 48,
            }}
          />
          <div
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #fde68a 52%, #fb923c 100%)",
              borderRadius: "76% 24% 70% 30% / 76% 30% 76% 26%",
              height: 38,
              position: "absolute",
              transform: `translateY(${34 + flameRise * 0.35}px) rotate(${flameLean - 36}deg) scale(${0.92 + flicker})`,
              width: 24,
            }}
          />
          <div
            style={{
              background: "rgba(30, 64, 175, 0.14)",
              borderRadius: "999px 999px 26px 26px",
              bottom: 10,
              height: 18,
              position: "absolute",
              width: 78,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 0,
            lineHeight: 1,
          }}
        >
          Station Ops
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function StartupAnimation() {
  const [visible, setVisible] = useState(() => !hasPlayedStartupAnimation);

  useEffect(() => {
    if (!visible) {
      return;
    }

    hasPlayedStartupAnimation = true;

    const timeout = window.setTimeout(() => setVisible(false), 3300);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-label="Opening Station Ops"
      className="fixed inset-0 z-50 bg-background"
      role="status"
    >
      <Player
        acknowledgeRemotionLicense
        autoPlay
        clickToPlay={false}
        component={StartupComposition}
        compositionHeight={720}
        compositionWidth={1280}
        controls={false}
        durationInFrames={96}
        fps={30}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
