<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import TimeSeriesChart from '$lib/components/TimeSeriesChart.svelte';
	import ParquetViewer from '$lib/components/ParquetViewer.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { themeStore } from '$lib/stores/theme.js';

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
	let sidebarOpen = $state(false); // For mobile toggle
	let currentTheme = $state('light');
	let currentToggleTheme = $state(() => {});
	let chartTooltip = $state({ visible: false, x: 0, y: 0, fecha: '', valor: '', unidad: '' });
	let lastDataDate = $state(null);

	// Subscribe to theme store
	$effect(() => {
		const unsubscribe = themeStore.subscribe((value) => {
			currentTheme = value.theme;
			currentToggleTheme = value.toggleTheme;
		});
		return unsubscribe;
	});

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

			// Calculate last data date
			const allDates = data.map((d) => new Date(d.fecha));
			lastDataDate = d3.max(allDates);

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
	function downloadSeriesTiempo() {
		const a = document.createElement('a');
		a.href = '/serie_tiempo.zip';
		a.download = 'serie_tiempo.zip';
		a.click();
		showDownloadMenu = false;
	}

	function downloadOldFormat() {
		const a = document.createElement('a');
		a.href = '/Semanal 2_2025.xlsx';
		a.download = 'Semanal 2_2025.xlsx';
		a.click();
		showDownloadMenu = false;
	}

	function toggleDownloadMenu() {
		showDownloadMenu = !showDownloadMenu;
	}

	function viewDatabase() {
		showParquetViewer = true;
	}

	// Close download dropdown when clicking outside
	$effect(() => {
		function handleClickOutside(event) {
			const isDownloadMenu = event.target.closest('.download-menu-container');

			if (showDownloadMenu && !isDownloadMenu) {
				showDownloadMenu = false;
			}
		}

		if (showDownloadMenu) {
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

<main class="h-screen flex flex-col bg-light-body dark:bg-dark-body overflow-hidden">
	<!-- Header - Card with spacing on desktop -->
	<header class="md:mx-6 md:mt-6 md:rounded-lg border-b md:border border-light-fill dark:border-dark-fill bg-light-background dark:bg-dark-background md:shadow-sm">
		<div class="px-4 md:px-6 py-6 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3 md:gap-4">
				<!-- BCB Logo -->
				<img
					src="/logo.png"
					alt="Banco Central de Bolivia"
					class="h-8 md:h-12 w-auto object-contain"
				/>

				<!-- Title -->
				<h1 class="text-2xl md:text-3xl font-display font-normal tracking-tight text-light-titulo dark:text-dark-titulo">
					<span class="block md:inline">Banco Central de Bolivia</span>
					<span class="hidden md:inline text-gray-400 dark:text-gray-600 mx-2">•</span>
					<span class="block md:inline text-lg md:text-3xl opacity-80">Estadísticas Semanales</span>
				</h1>
			</div>

			<!-- Desktop Control Panel - Action buttons + Theme toggle -->
			<div class="hidden md:flex items-center gap-2 border border-light-fill dark:border-dark-fill rounded-lg p-1">
				<!-- Download Button with Dropdown -->
				<div class="relative download-menu-container">
					<button
						onclick={toggleDownloadMenu}
						class="group px-3 py-2 rounded border border-transparent hover:border-light-accent dark:hover:border-dark-accent hover:bg-light-accent-soft/60 dark:hover:bg-dark-accent-soft/60 transition-colors font-normal flex items-center gap-2 text-sm"
						title="Descargar datos en diferentes formatos"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
						</svg>
						<span>Descargas</span>
						<svg class="w-3 h-3 transition-transform {showDownloadMenu ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
						</svg>
					</button>

					<!-- Dropdown Menu -->
					{#if showDownloadMenu}
						<div class="absolute top-full mt-2 right-0 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded shadow-sm overflow-hidden z-10 min-w-[280px]">
							<button
								onclick={downloadSeriesTiempo}
								class="w-full px-4 py-2.5 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors flex items-center gap-3 font-normal text-sm"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
								</svg>
								<span>Serie de tiempo (CSV y Excel)</span>
							</button>
							<button
								onclick={downloadOldFormat}
								class="w-full px-4 py-2.5 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors flex items-center gap-3 font-normal text-sm"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
								</svg>
								<span>Estado semanal clásico</span>
							</button>
						</div>
					{/if}
				</div>

				<!-- Separator -->
				<div class="w-px h-6 bg-light-fill dark:bg-dark-fill"></div>

				<!-- View Database Button -->
				<button
					onclick={viewDatabase}
					class="px-3 py-2 rounded border border-transparent hover:border-light-accent dark:hover:border-dark-accent hover:bg-light-accent-soft/60 dark:hover:bg-dark-accent-soft/60 transition-colors font-normal flex items-center gap-2 text-sm"
					title="Explorar base de datos completa en vivo"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
					</svg>
					<span>Explorar</span>
				</button>

				<!-- Separator -->
				<div class="w-px h-6 bg-light-fill dark:bg-dark-fill"></div>

				<!-- Theme Toggle -->
				<button
					onclick={currentToggleTheme}
					class="p-2 rounded border border-transparent hover:border-light-accent dark:hover:border-dark-accent hover:bg-light-accent-soft/60 dark:hover:bg-dark-accent-soft/60 transition-colors"
					aria-label="Toggle theme"
				>
					{#if currentTheme === 'light'}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						</svg>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					{/if}
				</button>
			</div>

			<!-- Mobile menu toggle -->
			<button
				onclick={() => sidebarOpen = !sidebarOpen}
				class="md:hidden px-3 py-2 bg-light-fill dark:bg-dark-fill rounded"
				aria-label="Toggle menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
				</svg>
			</button>
		</div>
	</header>

	{#if loading}
		<div class="flex justify-center items-center flex-1">
			<div class="text-xl">Cargando datos...</div>
		</div>
	{:else}
		<!-- Main Layout with Sidebar - Grows to fill available space -->
		<div class="flex md:gap-6 p-2 md:px-6 md:py-6 flex-1 overflow-hidden">
			<!-- Sidebar Component -->
			<Sidebar
				{categorias}
				{variables}
				{subvariables}
				bind:selectedCategoria
				bind:selectedVariable
				bind:selectedSubvariable
				bind:isOpen={sidebarOpen}
				bind:showDownloadMenu
				onCategoriaChange={handleCategoriaChange}
				onVariableChange={handleVariableChange}
				onSubvariableChange={handleSubvariableChange}
				onDownload={toggleDownloadMenu}
				onExplore={viewDatabase}
			/>

			<!-- Main Content Area -->
			<div class="flex-1 min-w-0 flex flex-col overflow-hidden">
				<!-- Chart Section - Card with breathing room, fills available height -->
				<section class="bg-light-background dark:bg-dark-background rounded-lg border border-light-fill dark:border-dark-fill shadow-sm p-3 md:p-8 flex-1 flex flex-col overflow-hidden">
					<!-- Chart Title Header with Tooltip -->
					<div class="mb-3 md:mb-6 flex items-center justify-between gap-6">
						<div class="flex-1">
							{#each chartTitle as line, i}
								<h2
									class="
										{i === 0 ? 'text-xs md:text-base opacity-70' : ''}
										{i === 1 ? 'text-base md:text-2xl font-display font-semibold mt-0.5 md:mt-1' : ''}
										{i === 2 ? 'text-sm md:text-lg font-medium mt-0.5 md:mt-1 opacity-80' : ''}
										text-light-titulo dark:text-dark-titulo
									"
								>
									{line}
								</h2>
							{/each}
						</div>

						<!-- Tooltip at title level -->
						{#if chartTooltip.visible}
							<div class="pointer-events-none mr-8 md:mr-20 text-right">
								<div class="text-xs md:text-base font-normal text-light-titulo dark:text-dark-titulo opacity-70 dark:opacity-60 mb-0.5 md:mb-1">
									{chartTooltip.fecha}
								</div>
								<div class="text-lg md:text-3xl font-bold text-light-accent-bronze dark:text-dark-accent-bronze mb-0.5 md:mb-1">
									{chartTooltip.valor}
								</div>
								<div class="text-sm md:text-lg font-normal text-light-titulo dark:text-dark-titulo opacity-70 dark:opacity-60">
									{chartTooltip.unidad}
								</div>
							</div>
						{/if}
					</div>

					<!-- Chart - fills remaining space -->
					<div class="flex-1 overflow-hidden">
						<TimeSeriesChart data={desagregado} {isDark} showTitle={false} bind:tooltip={chartTooltip} />
					</div>
					<!-- Footer - inside chart section -->
					<footer class="text-center text-sm text-gray-600 dark:text-gray-400 pt-4">
					<p>
						Última actualización: {lastDataDate
							? lastDataDate.toLocaleDateString('es-ES', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
									timeZone: 'UTC'
								})
							: '...'}
					</p>
				</footer>
			</section>
		</div>
		</div>
	{/if}
</main>

<!-- Mobile Download Menu Modal -->
{#if showDownloadMenu}
	<div class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end download-menu-container" onclick={() => (showDownloadMenu = false)}>
		<div class="w-full bg-light-background dark:bg-dark-background rounded-t-2xl p-6 animate-slideDown download-menu-container" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-light-titulo dark:text-dark-titulo">Descargar datos</h3>
				<button
					onclick={() => (showDownloadMenu = false)}
					class="p-2 hover:bg-light-fill dark:hover:bg-dark-fill rounded"
					aria-label="Cerrar"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="space-y-2">
				<button
					onclick={downloadSeriesTiempo}
					class="w-full px-4 py-3 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors flex items-center gap-3 rounded"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
					<span>Serie de tiempo (CSV y Excel)</span>
				</button>
				<button
					onclick={downloadOldFormat}
					class="w-full px-4 py-3 text-left hover:bg-light-fill dark:hover:bg-dark-fill transition-colors flex items-center gap-3 rounded"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
					</svg>
					<span>Estado semanal clásico</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Parquet Viewer Modal -->
<ParquetViewer bind:isOpen={showParquetViewer} filteredData={desagregado} title={chartTitle} />

