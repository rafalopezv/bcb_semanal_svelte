<script>
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
		onSubvariableChange
	} = $props();

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
	class="fixed md:sticky top-0 left-0 h-screen w-80 bg-light-background dark:bg-dark-background border-r border-light-fill dark:border-dark-fill overflow-y-auto z-50 transition-transform duration-300 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'} md:translate-x-0"
>
	<div class="p-4">
		<!-- Close button for mobile -->
		<button
			onclick={() => (isOpen = false)}
			class="md:hidden absolute top-4 right-4 p-2 hover:bg-light-fill dark:hover:bg-dark-fill rounded"
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

		<!-- Hierarchical Navigation -->
		<nav class="space-y-1 mt-12 md:mt-0">
			{#each categorias as categoria}
				<div class="border-b border-light-fill dark:border-dark-fill last:border-0">
					<!-- Category Button -->
					<button
						onclick={() => selectCategoria(categoria)}
						class="w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors {selectedCategoria ===
						categoria
							? 'bg-light-fill dark:bg-dark-fill text-light-titulo dark:text-dark-titulo'
							: 'text-light-titulo dark:text-dark-titulo opacity-70 hover:opacity-100 hover:bg-light-fill dark:hover:bg-dark-fill'}"
					>
						<div class="flex items-center justify-between">
							<span>{categoria}</span>
							<svg
								class="w-4 h-4 transition-transform {expandedCategoria === categoria
									? 'rotate-90'
									: ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</div>
					</button>

					<!-- Variables (shown when category is expanded) -->
					{#if expandedCategoria === categoria}
						<div class="ml-4 mt-1 mb-2 space-y-0.5">
							{#each variables[categoria] || [] as variable}
								<div>
									<!-- Variable Button -->
									<button
										onclick={() => selectVariable(variable)}
										class="w-full text-left px-3 py-2 text-sm rounded transition-colors {selectedVariable ===
										variable
											? 'bg-light-fill dark:bg-dark-fill text-light-titulo dark:text-dark-titulo font-medium'
											: 'text-light-titulo dark:text-dark-titulo opacity-60 hover:opacity-100 hover:bg-light-fill dark:hover:bg-dark-fill'}"
									>
										{variable}
									</button>

									<!-- Subvariables (shown when variable is selected and has subvariables) -->
									{#if selectedVariable === variable && subvariables[variable]?.length > 0}
										<div class="ml-4 mt-1 mb-1 space-y-0.5">
											{#each subvariables[variable] as subvariable}
												<button
													onclick={() => selectSubvariable(subvariable)}
													class="w-full text-left px-3 py-1.5 text-xs rounded transition-colors {selectedSubvariable ===
													subvariable
														? 'bg-light-fill dark:bg-dark-fill text-light-titulo dark:text-dark-titulo font-medium'
														: 'text-light-titulo dark:text-dark-titulo opacity-50 hover:opacity-100 hover:bg-light-fill dark:hover:bg-dark-fill'}"
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
