import type { NextConfig } from "next";

// ─── Режимы сборки ──────────────────────────────────────────────────
// STATIC_EXPORT=1  → статический экспорт для GitHub Pages
//                    (сборка в out/, все пути с префиксом /Studio)
// по умолчанию     → standalone-сервер для песочницы

const isStaticExport = process.env.STATIC_EXPORT === "1";
const PAGES_BASE = "/Studio";

const baseConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

const nextConfig: NextConfig = isStaticExport
  ? {
      ...baseConfig,
      output: "export",
      basePath: PAGES_BASE,
      images: { unoptimized: true },
      // отдельный distDir: экспорт пишется в эту папку,
      // не пересекаясь со standalone/dev-сборкой (.next)
      distDir: process.env.NEXT_DIST_DIR || ".next-export",
    }
  : {
      ...baseConfig,
      output: "standalone",
      distDir: process.env.NEXT_DIST_DIR || ".next",
    };

export default nextConfig;
