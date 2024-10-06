// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

import svelte from '@astrojs/svelte';

import node from '@astrojs/node';

import playformCompress from '@playform/compress';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    svelte(),
    playformCompress({
      JavaScript: {
        terser:{
          mangle: true,
          module: true,
        }
      }
    }),
  ],
 
  // output: 'hybrid',

  // experimental: {
  //   serverIslands: true,
  // },

  // adapter: node({
  //   mode: 'standalone',
  // }),
});