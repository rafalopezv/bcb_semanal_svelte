<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import TimeSeriesChart from '$lib/components/TimeSeriesChart.svelte';
	import ParquetViewer from '$lib/components/ParquetViewer.svelte';

	let data = $state([]);
	let dataIndex = $state({}); // NEW: Pre-indexed data for instant lookup
	let variables = $state({});
	let subvariables = $state({});
	let categorias = $state([]);
	let selectedCategoria = $state('Operaciones con el exterior');
	let selectedVariable = $state('');
	let selectedSubvariable = $state('');
	let loading = $state(true);
	let isDark = $state(false);
	let showParquetViewer = $state(false);
	let showCategoriaMenu = $state(false);
	let showVariableMenu = $state(false);
	let showSubvariableMenu = $state(false);

	// Detect dark mode
	onMount(async () => {
		// Load data
		try {
			const csvData = await d3.csv('/datos.csv', (d) => ({
				unidad: d.unidad,
				categoria: d.categoria,
				variable: d.variable,
				subvariable: d.subvariable,
				fecha: d.fecha,
				valor: +d.valor
			}));

			data = csvData;

			// Build index: variable -> subvariable -> data[] for instant lookups
			const index = {};
			for (const row of data) {
				const v = row.variable;
				const sv = row.subvariable || '_default';

				if (!index[v]) index[v] = {};
				if (!index[v][sv]) index[v][sv] = [];
				index[v][sv].push(row);
			}
			dataIndex = index;

			// Group variables by category
			const groupedVars = d3.rollup(
				data,
				(v) => [...new Set(v.map((d) => d.variable))],
				(d) => d.categoria
			);

			variables = Object.fromEntries(groupedVars);
			categorias = Object.keys(variables);

			// Group subvariables by variable
			const groupedSubvars = d3.rollup(
				data,
				(v) => [...new Set(v.map((d) => d.subvariable).filter((s) => s !== ''))],
				(d) => d.variable
			);

			subvariables = Object.fromEntries(groupedSubvars);

			// Set default variable
			if (variables[selectedCategoria]) {
				selectedVariable = variables[selectedCategoria][0];
			}

			// Set default subvariable if applicable
			if (subvariables[selectedVariable]?.length > 0) {
				selectedSubvariable = subvariables[selectedVariable][0];
			}

			loading = false;
		} catch (error) {
			console.error('Error loading data:', error);
			loading = false;
		}

		// Check dark mode
		isDark = document.documentElement.classList.contains('dark');

		// Watch for theme changes
		const observer = new MutationObserver(() => {
			isDark = document.documentElement.classList.contains('dark');
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});

		return () => observer.disconnect();
	});

	function handleCategoriaChange(newCategoria) {
		const newVariable = variables[newCategoria]?.[0] || '';
		const newSubvariable =
			subvariables[newVariable]?.length > 0 ? subvariables[newVariable][0] : '';

		// Batch all state updates together
		selectedCategoria = newCategoria;
		selectedVariable = newVariable;
		selectedSubvariable = newSubvariable;
		showCategoriaMenu = false;
	}

	function handleVariableChange(newVariable) {
		const newSubvariable =
			subvariables[newVariable]?.length > 0 ? subvariables[newVariable][0] : '';

		// Batch state updates
		selectedVariable = newVariable;
		selectedSubvariable = newSubvariable;
		showVariableMenu = false;
	}

	function handleSubvariableChange(newSubvariable) {
		selectedSubvariable = newSubvariable;
		showSubvariableMenu = false;
	}

	// Simple derived values - no complex computations
	const hasVariables = $derived(variables[selectedCategoria]?.length > 0);
	const hasSubvariables = $derived(subvariables[selectedVariable]?.length > 1);

	// Get current subvariable options
	const currentSubvariables = $derived(subvariables[selectedVariable] || []);
	const isSubvariableEnabled = $derived(currentSubvariables.length > 1);

	// INSTANT lookup using pre-built index
	const desagregado = $derived.by(() => {
		let result = [];

		if (dataIndex[selectedVariable]) {
			if (selectedSubvariable) {
				// Lookup specific subvariable
				result = dataIndex[selectedVariable][selectedSubvariable] || [];
			} else {
				// Get all subvariables for this variable
				result = Object.values(dataIndex[selectedVariable]).flat();
			}
		}

		return result;
	});

	// Create multi-line title for chart
	const chartTitle = $derived.by(() => {
		const lines = [];
		if (selectedCategoria) lines.push(selectedCategoria);
		if (selectedVariable) lines.push(selectedVariable);
		if (selectedSubvariable) lines.push(selectedSubvariable);
		return lines;
	});

	// Download state
	let showDownloadMenu = $state(false);

	// Download functions
	function downloadCSV() {
		const csv = d3.csvFormat(desagregado);
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'data.csv';
		a.click();
		URL.revokeObjectURL(url);
		showDownloadMenu = false;
	}

	function downloadXLSX() {
		// TODO: Implement XLSX download
		console.log('XLSX download - to be implemented');
		showDownloadMenu = false;
	}

	function downloadOldFormat() {
		// TODO: Implement old format download
		console.log('Old format download - to be implemented');
		showDownloadMenu = false;
	}

	function toggleDownloadMenu() {
		showDownloadMenu = !showDownloadMenu;
	}

	function viewDatabase() {
		showParquetViewer = true;
	}

	function toggleCategoriaMenu() {
		showCategoriaMenu = !showCategoriaMenu;
		showVariableMenu = false;
		showSubvariableMenu = false;
	}

	function toggleVariableMenu() {
		if (!hasVariables) return;
		showVariableMenu = !showVariableMenu;
		showCategoriaMenu = false;
		showSubvariableMenu = false;
	}

	function toggleSubvariableMenu() {
		if (!isSubvariableEnabled) return;
		showSubvariableMenu = !showSubvariableMenu;
		showCategoriaMenu = false;
		showVariableMenu = false;
	}

	// Close dropdowns when clicking outside
	$effect(() => {
		function handleClickOutside(event) {
			const isDownloadMenu = event.target.closest('.download-menu-container');
			const isCategoriaMenu = event.target.closest('.categoria-menu-container');
			const isVariableMenu = event.target.closest('.variable-menu-container');
			const isSubvariableMenu = event.target.closest('.subvariable-menu-container');

			if (showDownloadMenu && !isDownloadMenu) {
				showDownloadMenu = false;
			}
			if (showCategoriaMenu && !isCategoriaMenu) {
				showCategoriaMenu = false;
			}
			if (showVariableMenu && !isVariableMenu) {
				showVariableMenu = false;
			}
			if (showSubvariableMenu && !isSubvariableMenu) {
				showSubvariableMenu = false;
			}
		}

		if (showDownloadMenu || showCategoriaMenu || showVariableMenu || showSubvariableMenu) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<svelte:head>
	<title>Reportes del Banco Central de Bolivia</title>
	<meta
		name="description"
		content="Indicadores semanales del Banco Central de Bolivia - Datos económicos y financieros"
	/>
</svelte:head>

<main class="max-w-7xl mx-auto px-4 py-8">
	<!-- Header -->
	<header class="text-center mb-8 pr-8 md:pr-0">
		<h1
			class="text-3xl md:text-4xl font-normal tracking-tight text-light-titulo dark:text-dark-titulo flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3"
		>
			<span>Estadísticas Semanales</span>
			<span class="hidden md:inline text-gray-400 dark:text-gray-600">•</span>
			<span>Banco Central de Bolivia</span>
		</h1>
	</header>

	{#if loading}
		<div class="flex justify-center items-center min-h-[400px]">
			<div class="text-xl">Cargando datos...</div>
		</div>
	{:else}
		<!-- Selection Controls - Compact Button Style -->
		<div class="max-w-5xl mx-auto mb-8">
			<div class="flex flex-wrap justify-center gap-3">
				<!-- Category Dropdown -->
				<div class="relative categoria-menu-container">
					<button
						onclick={toggleCategoriaMenu}
						class="px-4 py-2.5 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded hover:bg-light-fill dark:hover:bg-dark-fill transition-colors font-normal flex items-center gap-2 text-sm"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
						</svg>
						<span>Categoría</span>
						<svg class="w-4 h-4 transition-transform {showCategoriaMenu ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
						</svg>
					</button>

					{#if showCategoriaMenu}
						<div class="absolute top-full mt-2 left-0 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded shadow-sm overflow-hidden z-10 min-w-[250px] max-h-[400px] overflow-y-auto">
							{#each categorias as categoria}
								<button
									onclick={() => handleCategoriaChange(categoria)}
									class="w-full px-4 py-2.5 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors font-normal text-sm {selectedCategoria === categoria ? 'bg-light-fill dark:bg-dark-fill' : ''}"
								>
									{categoria}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Variable Dropdown -->
				<div class="relative variable-menu-container">
					<button
						onclick={toggleVariableMenu}
						disabled={!hasVariables}
						class="px-4 py-2.5 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded hover:bg-light-fill dark:hover:bg-dark-fill transition-colors font-normal flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
						</svg>
						<span>Variable</span>
						<svg class="w-4 h-4 transition-transform {showVariableMenu ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
						</svg>
					</button>

					{#if showVariableMenu}
						<div class="absolute top-full mt-2 left-0 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded shadow-sm overflow-hidden z-10 min-w-[250px] max-h-[400px] overflow-y-auto">
							{#each variables[selectedCategoria] || [] as variable}
								<button
									onclick={() => handleVariableChange(variable)}
									class="w-full px-4 py-2.5 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors font-normal text-sm {selectedVariable === variable ? 'bg-light-fill dark:bg-dark-fill' : ''}"
								>
									{variable}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Subvariable Dropdown -->
				<div class="relative subvariable-menu-container">
					<button
						onclick={toggleSubvariableMenu}
						disabled={!isSubvariableEnabled}
						class="px-4 py-2.5 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded hover:bg-light-fill dark:hover:bg-dark-fill transition-colors font-normal flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
						</svg>
						<span>Subvariable</span>
						<svg class="w-4 h-4 transition-transform {showSubvariableMenu ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
						</svg>
					</button>

					{#if showSubvariableMenu}
						<div class="absolute top-full mt-2 left-0 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded shadow-sm overflow-hidden z-10 min-w-[250px] max-h-[400px] overflow-y-auto">
							{#if currentSubvariables.length === 0}
								<div class="px-4 py-2.5 text-sm opacity-50">N/A</div>
							{:else}
								{#each currentSubvariables as subvariable}
									<button
										onclick={() => handleSubvariableChange(subvariable)}
										class="w-full px-4 py-2.5 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors font-normal text-sm {selectedSubvariable === subvariable ? 'bg-light-fill dark:bg-dark-fill' : ''}"
									>
										{subvariable}
									</button>
								{/each}
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Chart Section -->
		<section class="mb-6">
			<div class="max-w-5xl mx-auto w-full">
				<TimeSeriesChart data={desagregado} {isDark} title={chartTitle} />
			</div>
		</section>

		<!-- Action Buttons -->
		<div class="flex justify-center gap-3 mb-12 relative">
			<!-- Download Button with Dropdown -->
			<div class="relative download-menu-container">
				<button
					onclick={toggleDownloadMenu}
					class="group px-5 py-2.5 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded hover:bg-light-fill dark:hover:bg-dark-fill transition-colors font-normal flex items-center gap-2"
					title="Descargar datos en diferentes formatos"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
					</svg>
					<span class="hidden sm:inline">Descargar datos</span>
					<span class="sm:hidden">Descargar</span>
					<svg class="w-4 h-4 transition-transform {showDownloadMenu ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
					</svg>
				</button>

				<!-- Dropdown Menu -->
				{#if showDownloadMenu}
					<div class="absolute bottom-full mb-2 left-0 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded shadow-sm overflow-hidden z-10 min-w-[280px]">
						<button
							onclick={downloadCSV}
							class="w-full px-4 py-2.5 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors flex items-center gap-3 font-normal"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
							</svg>
							<span>Serie de tiempo CSV</span>
						</button>
						<button
							onclick={downloadXLSX}
							class="w-full px-4 py-2.5 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors flex items-center gap-3 font-normal"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
							</svg>
							<span>Serie de tiempo XLSX</span>
						</button>
						<button
							onclick={downloadOldFormat}
							class="w-full px-4 py-2.5 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors flex items-center gap-3 font-normal"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
							</svg>
							<span>Estado semanal clásico XLSX</span>
						</button>
						<button
							onclick={downloadOldFormat}
							class="w-full px-4 py-2.5 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors flex items-center gap-3 font-normal"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h1m-1 4h1m4-4h1m-1 4h1"/>
							</svg>
							<span>Estado semanal clásico PDF</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- View Database Button -->
			<button
				onclick={viewDatabase}
				class="px-5 py-2.5 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded hover:bg-light-fill dark:hover:bg-dark-fill transition-colors font-normal flex items-center gap-2"
				title="Explorar base de datos completa en vivo"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
				</svg>
				<span class="hidden sm:inline">Explorar datos</span>
				<span class="sm:hidden">Explorar</span>
			</button>
		</div>
	{/if}

	<!-- Footer -->
	<footer class="text-center text-sm text-gray-600 dark:text-gray-400 mt-8 pb-8">
		<p class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
			<span>
				Datos del
				<a
					href="https://www.bcb.gob.bo/?q=estad-sticas-semanales"
					target="_blank"
					rel="noopener noreferrer"
					class="underline decoration-dotted underline-offset-2 decoration-1 hover:text-light-focus-primary dark:hover:text-dark-focus-primary"
				>
					Banco Central de Bolivia
				</a>
			</span>
			<span class="hidden sm:inline text-gray-400 dark:text-gray-600">•</span>
			<span>
				Última actualización: {new Date().toLocaleDateString('es-ES', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</span>
		</p>
	</footer>
</main>

<!-- Parquet Viewer Modal -->
<ParquetViewer bind:isOpen={showParquetViewer} filteredData={desagregado} title={chartTitle} />

