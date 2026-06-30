import type { Metadata, Viewport } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { StartupAnimation } from "@/components/startup-animation";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Station Ops — Pokhara Fire Station",
  description: "Mess finance and leave tracking for Pokhara Fire Station staff.",
  applicationName: "Station Ops",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Station Ops",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${firaSans.variable} ${firaCode.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col">
        <StartupAnimation />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
