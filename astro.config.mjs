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
  outDir: !process.env.VERCEL ? "../dist" : "dist",
  trailingSlash: "never",
  base: "/",
  // vite: {
  //   build: {
  //     rollupOptions: {
  //       output: {
  //         // Make sure each page generates a flat file like `login.html` instead of `login/index.html`
  //         entryFileNames: "[name].html",
  //       },
  //     },
  //   },
  // },
  build: {
    format: "file",
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

  // output: 'hybrid',

  // experimental: {
  //   serverIslands: true,
  // },

  // adapter: node({
  //   mode: 'standalone',
  // }),
});
