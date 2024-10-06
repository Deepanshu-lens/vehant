/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
        		sans: ['Inter', 'sans-serif'], // Set Inter as the default sans-serif font
     		},
			backdropSaturate: {
				'180': '180%', // Add custom backdrop saturate
			},
			boxShadow: {
				'custom-md': '0 0 15px 0 rgba(0, 0, 0, 0.1)', // Custom box shadow
			},
		},
	},
	plugins: [],
}
