// @ts-ignore
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

import svelte from "@astrojs/svelte";

import icon from "astro-icon";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  outDir: !process.env.VERCEL ? "../dist" : "dist",
  trailingSlash: "never",
  base: "/",
  build: {
    format: !process.env.VERCEL ? "file" : "directory",
    assetsPrefix: "./", // Ensures that asset paths are relative
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    svelte(),
    icon(),
    react(),
    // playformCompress({
    //   JavaScript: {
    //     terser: {
    //       mangle: true,
    //       module: true,
    //     },
    //   },
    // }),
  ],
});
