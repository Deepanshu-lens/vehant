// @ts-ignore
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

import svelte from "@astrojs/svelte";

import node from "@astrojs/node";

import playformCompress from "@playform/compress";

import icon from "astro-icon";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  outDir: "../dist",
  build: {
    assetsPrefix: "./", // Ensures that asset paths are relative
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    svelte(),
    playformCompress({
      JavaScript: {
        terser: {
          mangle: true,
          module: true,
        },
      },
    }),
    icon(),
    react(),
  ],

  // output: 'hybrid',

  // experimental: {
  //   serverIslands: true,
  // },

  // adapter: node({
  //   mode: 'standalone',
  // }),
});
