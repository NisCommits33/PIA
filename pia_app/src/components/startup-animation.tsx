"use client";

import { useEffect, useState } from "react";
import { Player } from "@remotion/player";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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

function StartupComposition() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({
    frame,
    fps,
    config: {
      damping: 18,
      stiffness: 120,
      mass: 0.82,
    },
  });
  const settle = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: {
      damping: 24,
      stiffness: 90,
      mass: 0.7,
    },
  });
  const outro = interpolate(frame, [64, 82], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(intro, [0, 1], [0.74, 1.04]) - settle * 0.04;
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotate = interpolate(frame, [0, 24, 48], [-7, 1.2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringScale = interpolate(frame, [4, 48], [0.82, 1.28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(frame, [4, 22, 56], [0, 0.45, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [18, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [18, 32], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sheenX = interpolate(frame, [18, 54], [-150, 150], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 50% 42%, rgba(220, 38, 38, 0.18), transparent 33%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
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
          gap: 22,
          transform: `translateY(-10px)`,
        }}
      >
        <div
          style={{
            height: 226,
            position: "relative",
            width: 226,
          }}
        >
          <div
            style={{
              background:
                "radial-gradient(circle, rgba(249,115,22,0.42), rgba(220,38,38,0.16) 45%, transparent 70%)",
              borderRadius: 999,
              filter: "blur(18px)",
              height: 244,
              left: -9,
              position: "absolute",
              top: -2,
              transform: `scale(${1 + intro * 0.14})`,
              width: 244,
            }}
          />
          <div
            style={{
              border: "2px solid rgba(220, 38, 38, 0.34)",
              borderRadius: 999,
              height: 220,
              left: 3,
              opacity: ringOpacity,
              position: "absolute",
              top: 3,
              transform: `scale(${ringScale})`,
              width: 220,
            }}
          />
          <div
            style={{
              borderRadius: 36,
              filter: "drop-shadow(0 24px 42px rgba(15, 23, 42, 0.24))",
              height: 226,
              opacity: logoOpacity,
              overflow: "hidden",
              position: "relative",
              transform: `scale(${logoScale}) rotate(${rotate}deg)`,
              width: 226,
            }}
          >
            <Img
              src={staticFile("pia-arff-logo.png")}
              style={{
                height: "100%",
                objectFit: "contain",
                width: "100%",
              }}
            />
            <div
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
                height: 270,
                left: "50%",
                position: "absolute",
                top: -22,
                transform: `translateX(${sheenX}px) rotate(23deg)`,
                width: 38,
              }}
            />
          </div>
        </div>
        <div
          style={{
            fontSize: 25,
            fontWeight: 800,
            letterSpacing: 0,
            lineHeight: 1,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          PIA ARFF
        </div>
      </div>
    </AbsoluteFill>
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
      <Player
        acknowledgeRemotionLicense
        autoPlay
        clickToPlay={false}
        component={StartupComposition}
        compositionHeight={720}
        compositionWidth={1280}
        controls={false}
        durationInFrames={84}
        fps={30}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
