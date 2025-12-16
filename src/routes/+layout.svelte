<script>
	import '../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Get current theme from document
	let theme = $state('light');

	onMount(() => {
		// Read current theme from DOM (already set by app.html script)
		theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

		// Listen for system theme changes (only if user hasn't set preference)
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e) => {
			if (!localStorage.getItem('theme')) {
				theme = e.matches ? 'dark' : 'light';
				applyTheme();
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
	}
</script>

<div class="min-h-screen">
	<!-- Theme Toggle Button -->
	<div class="fixed top-4 right-4 md:top-6 md:right-6 z-50">
		<button
			onclick={toggleTheme}
			class="p-2 rounded-full bg-transparent hover:bg-light-fill dark:hover:bg-dark-fill transition-colors opacity-60 hover:opacity-100"
			aria-label="Toggle theme"
		>
			{#if theme === 'light'}
				<svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			{:else}
				<svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			{/if}
		</button>
	</div>

	{@render children()}
</div>
