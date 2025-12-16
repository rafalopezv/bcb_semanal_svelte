<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { themeStore } from '$lib/stores/theme.js';

	let { children } = $props();

	// Get current theme from document
	let theme = $state('light');

	onMount(() => {
		// Read current theme from DOM (already set by app.html script)
		theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

		// Update store with theme and toggle function
		themeStore.set({ theme, toggleTheme });

		// Listen for system theme changes (only if user hasn't set preference)
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e) => {
			if (!localStorage.getItem('theme')) {
				theme = e.matches ? 'dark' : 'light';
				applyTheme();
				themeStore.set({ theme, toggleTheme });
			}
		};
		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	});

	function applyTheme() {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
		applyTheme();
		themeStore.set({ theme, toggleTheme });
	}
</script>

<div class="min-h-screen">
	{@render children()}
</div>
