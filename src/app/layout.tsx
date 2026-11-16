import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "800", "900"],
});

export const metadata: Metadata = {
  title: "RVMXL // СТАНЦИЯ ВАЙБОВ",
  description:
    "Студия вайбкодинга RVMXL: приёмник сигналов из пурпурного вакуума. 6 офлайн-приложений — без серверов, без аналитики, данные не покидают устройство.",
  keywords: [
    "RVMXL",
    "вайбкодинг",
    "vibe coding",
    "офлайн-first",
    "HumNote",
    "OTGLens",
    "DocGen",
    "SmartFridge-Chef",
    "Student-AutoAlarm",
    "WarpScoutGUI",
  ],
  authors: [{ name: "RVMXL", url: "https://github.com/rvmxl" }],
  openGraph: {
    title: "RVMXL // СТАНЦИЯ ВАЙБОВ",
    description:
      "Студия вайбкодинга: 6 сигналов, 0 серверов, 100% офлайн. Настройтесь на частоту.",
    url: "https://github.com/rvmxl",
    siteName: "RVMXL STATION",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RVMXL // СТАНЦИЯ ВАЙБОВ",
    description:
      "Студия вайбкодинга: 6 сигналов, 0 серверов, 100% офлайн. Настройтесь на частоту.",
  },
};

export const viewport: Viewport = {
  themeColor: "#07040d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrains.variable} ${unbounded.variable} antialiased bg-[#07040d] text-[#e9defa]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
