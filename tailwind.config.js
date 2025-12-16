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
				'light-accent': '#4a8896',        // Teal vibrante (hover botones, círculo)
				'light-accent-dark': '#1f3238',   // Teal muy oscuro (texto en fondos activos)
				'light-accent-soft': '#a8cdd8',   // Teal claro (fondos activos)
				'light-accent-sage': '#6b8e6f',   // Verde sage (variedad, categorías)
				'light-accent-bronze': '#b8936b', // Bronce suave (highlights importantes)

				// Dark mode - Warm minimalist palette with life
				'dark-body': '#000000',
				'dark-frame': '#8a8a8a',
				'dark-background': '#151515',
				'dark-line': '#f0f0f0',
				'dark-titulo': '#fafafa',
				'dark-fill': '#262626',
				'dark-focus-primary': '#c9b896',
				'dark-focus-secondary': '#b0b0b0',
				'dark-accent': '#d4a574',        // Ámbar dorado vibrante (hover botones, círculo)
				'dark-accent-dark': '#e8c9a6',   // Ámbar claro (texto en fondos activos)
				'dark-accent-soft': '#3a3230',   // Marrón oscuro cálido (fondos activos)
				'dark-accent-sage': '#7a9d7e',   // Verde sage (variedad)
				'dark-accent-bronze': '#d4845f', // Naranja terracota suave (highlights)
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
