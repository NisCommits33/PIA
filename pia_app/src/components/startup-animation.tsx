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
  const logoScale = interpolate(intro, [0, 1], [0.7, 1.03]) - settle * 0.03;
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotate = interpolate(frame, [0, 24, 52], [-5, 1.1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tilt = interpolate(frame, [0, 24, 52], [10, -2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lift = interpolate(intro, [0, 1], [18, 0]);
  const glowScale = interpolate(frame, [0, 44], [0.76, 1.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowOpacity = interpolate(frame, [0, 18, 62], [0, 0.7, 0.25], {
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
  const sheenX = interpolate(frame, [16, 56], [-185, 185], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const emberOpacity = interpolate(frame, [12, 30, 70], [0, 0.75, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const embers = [
    { x: -118, y: 84, drift: -24, delay: 0, size: 5 },
    { x: 102, y: 96, drift: -30, delay: 5, size: 4 },
    { x: -52, y: 126, drift: -34, delay: 9, size: 3 },
    { x: 136, y: 30, drift: -26, delay: 12, size: 4 },
    { x: -140, y: 24, drift: -22, delay: 15, size: 3 },
  ];

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
            height: 292,
            perspective: 900,
            position: "relative",
            width: 292,
          }}
        >
          <div
            style={{
              background:
                "radial-gradient(circle, rgba(249,115,22,0.46), rgba(220,38,38,0.2) 44%, transparent 70%)",
              borderRadius: 999,
              filter: "blur(18px)",
              height: 264,
              left: 14,
              opacity: glowOpacity,
              position: "absolute",
              top: 32,
              transform: `scale(${glowScale})`,
              width: 264,
            }}
          />
          {embers.map((ember, index) => {
            const local = Math.max(0, frame - ember.delay);
            const rise = interpolate(local, [0, 54], [0, ember.drift], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const sway = Math.sin((frame + index * 11) / 7) * 5;
            return (
              <div
                key={index}
                style={{
                  background: "rgba(249, 115, 22, 0.78)",
                  borderRadius: 999,
                  boxShadow: "0 0 12px rgba(249, 115, 22, 0.8)",
                  height: ember.size,
                  left: 146 + ember.x + sway,
                  opacity: emberOpacity,
                  position: "absolute",
                  top: 142 + ember.y + rise,
                  width: ember.size,
                }}
              />
            );
          })}
          <div
            style={{
              filter: "drop-shadow(0 28px 44px rgba(15, 23, 42, 0.28))",
              height: 292,
              opacity: logoOpacity,
              position: "relative",
              transform: `translateY(${lift}px) scale(${logoScale}) rotate(${rotate}deg) rotateX(${tilt}deg)`,
              transformStyle: "preserve-3d",
              width: 292,
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
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.34), transparent)",
                height: 330,
                left: "50%",
                position: "absolute",
                top: -18,
                transform: `translateX(${sheenX}px) rotate(23deg)`,
                width: 46,
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

    const timeout = window.setTimeout(() => setVisible(false), 2800);
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
