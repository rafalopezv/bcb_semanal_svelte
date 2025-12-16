/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Light mode - Scandinavian minimalist palette
				'light-body': '#ececec',
				'light-frame': '#bdbdbd',
				'light-background': '#ffffff',
				'light-line': '#2b2b2b',
				'light-titulo': '#1a1a1a',
				'light-fill': '#e8e8e8',
				'light-focus-primary': '#1a1a1a',
				'light-focus-secondary': '#6b6b6b',

				// Dark mode - Deep dark minimalist palette (no blues)
				'dark-body': '#000000',
				'dark-frame': '#8a8a8a',
				'dark-background': '#151515',
				'dark-line': '#f0f0f0',
				'dark-titulo': '#fafafa',
				'dark-fill': '#262626',
				'dark-focus-primary': '#c9b896',
				'dark-focus-secondary': '#b0b0b0',
			},
			fontFamily: {
				'display': ['"Playfair Display"', 'serif'],
				'sans': [
					'Inter',
					'-apple-system',
					'BlinkMacSystemFont',
					'"Segoe UI"',
					'Roboto',
					'"Helvetica Neue"',
					'Arial',
					'sans-serif'
				]
			},
			keyframes: {
				slideDown: {
					'0%': { opacity: '0', transform: 'translateY(-10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				}
			},
			animation: {
				slideDown: 'slideDown 0.3s ease-out',
				fadeIn: 'fadeIn 0.6s ease-in'
			}
		}
	},
	plugins: []
};
