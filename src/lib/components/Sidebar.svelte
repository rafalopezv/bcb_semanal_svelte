<script>
	import { themeStore } from '$lib/stores/theme.js';

	let {
		categorias = [],
		variables = {},
		subvariables = {},
		selectedCategoria = $bindable(),
		selectedVariable = $bindable(),
		selectedSubvariable = $bindable(),
		isOpen = $bindable(false),
		onCategoriaChange,
		onVariableChange,
		onSubvariableChange,
		onDownload,
		onExplore,
		showDownloadMenu = $bindable(false)
	} = $props();

	let currentTheme = $state('light');
	let currentToggleTheme = $state(() => {});

	// Subscribe to theme store
	$effect(() => {
		const unsubscribe = themeStore.subscribe((value) => {
			currentTheme = value.theme;
			currentToggleTheme = value.toggleTheme;
		});
		return unsubscribe;
	});

	// Track expanded categories
	let expandedCategoria = $state(selectedCategoria);

	function selectCategoria(categoria) {
		expandedCategoria = expandedCategoria === categoria ? '' : categoria;
		if (onCategoriaChange) {
			onCategoriaChange(categoria);
		}
	}

	function selectVariable(variable) {
		if (onVariableChange) {
			onVariableChange(variable);
		}
	}

	function selectSubvariable(subvariable) {
		if (onSubvariableChange) {
			onSubvariableChange(subvariable);
		}
		// Close sidebar on mobile after selection
		if (window.innerWidth < 768) {
			isOpen = false;
		}
	}
</script>

<!-- Mobile Overlay -->
{#if isOpen}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
		onclick={() => (isOpen = false)}
	></div>
{/if}

<!-- Sidebar -->
<aside
	class="fixed md:sticky top-0 right-0 md:right-auto md:left-0 md:top-auto h-screen md:h-full w-80 bg-light-background dark:bg-dark-background md:rounded-lg border-l md:border border-light-fill dark:border-dark-fill md:shadow-sm overflow-y-auto z-50 transition-transform duration-300 {isOpen
		? 'translate-x-0'
		: 'translate-x-full'} md:translate-x-0"
>
	<div class="p-4">
		<!-- Mobile Header with Action Buttons and Close -->
		<div class="md:hidden mb-6 pb-4 border-b border-light-fill dark:border-dark-fill">
			<!-- Control Panel - Mobile -->
			<div class="flex items-center justify-between mb-4 pb-4 border-b border-light-fill dark:border-dark-fill">
				<div class="flex items-center gap-2 flex-1">
					<!-- Download Button -->
					<button
						onclick={onDownload}
						class="p-2 rounded hover:bg-light-fill dark:hover:bg-dark-fill transition-colors download-menu-container"
						title="Descargar datos"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
						</svg>
					</button>

					<!-- Explore Button -->
					<button
						onclick={onExplore}
						class="p-2 rounded hover:bg-light-fill dark:hover:bg-dark-fill transition-colors"
						title="Explorar datos"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
						</svg>
					</button>

					<!-- Separator -->
					<div class="w-px h-6 bg-light-fill dark:bg-dark-fill mx-1"></div>

					<!-- Theme Toggle -->
					<button
						onclick={currentToggleTheme}
						class="p-2 rounded hover:bg-light-fill dark:hover:bg-dark-fill transition-colors"
						aria-label="Toggle theme"
					>
						{#if currentTheme === 'light'}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
								/>
							</svg>
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
						{/if}
					</button>
				</div>

				<!-- Close button -->
				<button
					onclick={() => (isOpen = false)}
					class="p-2 hover:bg-light-fill dark:hover:bg-dark-fill rounded"
					aria-label="Close menu"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Mobile Labels -->
			<div class="flex gap-2 text-xs font-medium text-light-titulo dark:text-dark-titulo opacity-70">
				<span>Descargar</span>
				<span>•</span>
				<span>Explorar</span>
				<span>•</span>
				<span>Tema</span>
			</div>
		</div>

		<!-- Hierarchical Navigation -->
		<nav class="space-y-2">
			{#each categorias as categoria}
				<div class="border-b border-light-fill dark:border-dark-fill last:border-0 pb-2">
					<!-- Category Button - NIVEL 1 -->
					<button
						onclick={() => selectCategoria(categoria)}
						class="w-full text-left px-3 py-3 text-base font-semibold rounded transition-colors {selectedCategoria ===
						categoria
							? 'bg-light-accent-soft dark:bg-dark-accent-soft text-light-accent-dark dark:text-dark-accent-dark'
							: 'text-light-titulo dark:text-dark-titulo opacity-85 hover:opacity-100 hover:bg-light-accent-soft/40 dark:hover:bg-dark-accent-soft/60'}"
					>
						<div class="flex items-center justify-between gap-2">
							<span class="flex-1 leading-tight">{categoria}</span>
							<svg
								class="w-5 h-5 flex-shrink-0 transition-transform {expandedCategoria === categoria
									? 'rotate-90'
									: ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</div>
					</button>

					<!-- Variables (shown when category is expanded) - NIVEL 2 -->
					{#if expandedCategoria === categoria}
						<div class="ml-3 mt-2 mb-1 space-y-1">
							{#each variables[categoria] || [] as variable}
								<div>
									<!-- Variable Button -->
									<button
										onclick={() => selectVariable(variable)}
										class="w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors {selectedVariable ===
										variable
											? 'bg-light-accent-soft dark:bg-dark-accent-soft text-light-accent-dark dark:text-dark-accent-dark'
											: 'text-light-titulo dark:text-dark-titulo opacity-70 hover:opacity-100 hover:bg-light-accent-soft/40 dark:hover:bg-dark-accent-soft/60'}"
									>
										{variable}
									</button>

									<!-- Subvariables (shown when variable is selected and has subvariables) - NIVEL 3 -->
									{#if selectedVariable === variable && subvariables[variable]?.length > 0}
										<div class="ml-3 mt-1.5 mb-1 space-y-0.5">
											{#each subvariables[variable] as subvariable}
												<button
													onclick={() => selectSubvariable(subvariable)}
													class="w-full text-left px-3 py-2 text-xs font-normal rounded transition-colors {selectedSubvariable ===
													subvariable
														? 'bg-light-accent-soft dark:bg-dark-accent-soft text-light-accent-dark dark:text-dark-accent-dark font-medium'
														: 'text-light-titulo dark:text-dark-titulo opacity-60 hover:opacity-100 hover:bg-light-accent-soft/40 dark:hover:bg-dark-accent-soft/60'}"
												>
													{subvariable}
												</button>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</nav>
	</div>
</aside>
