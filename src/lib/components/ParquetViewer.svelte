<script>
	let { isOpen = $bindable(false), filteredData = [], title = [] } = $props();

	let columns = $state([]);
	let columnHeaders = $state([]);
	let currentPage = $state(0);
	let rowsPerPage = 100;
	let sortColumn = $state(null);
	let sortDirection = $state('asc'); // 'asc' or 'desc'

	// Setup columns when data is available
	$effect(() => {
		if (isOpen && filteredData.length > 0) {
			const originalColumns = Object.keys(filteredData[0]);

			// If columns are numeric indices (0, 1, 2...), map them to actual column names
			// Original order: unidad, categoria, variable, subvariable, fecha, valor
			// Desired order: categoria, variable, subvariable, fecha, valor, unidad
			if (!originalColumns.includes('categoria')) {
				// Data from CSV has named columns
				columns = ['categoria', 'variable', 'subvariable', 'fecha', 'valor', 'unidad'];
				columnHeaders = ['Categoría', 'Variable', 'Sub-variable', 'Fecha (AAAA-MM-DD)', 'Valor', 'Unidad'];
			} else {
				// Just in case
				columns = ['categoria', 'variable', 'subvariable', 'fecha', 'valor', 'unidad'];
				columnHeaders = ['Categoría', 'Variable', 'Sub-variable', 'Fecha (AAAA-MM-DD)', 'Valor', 'Unidad'];
			}

			// Reset pagination when data changes
			currentPage = 0;
			sortColumn = null;
			sortDirection = 'asc';
		}
	});

	function closeModal() {
		isOpen = false;
	}

	function sortByColumn(columnIndex) {
		if (sortColumn === columnIndex) {
			// Toggle direction if same column
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// New column, default to ascending
			sortColumn = columnIndex;
			sortDirection = 'asc';
		}
		currentPage = 0; // Reset to first page when sorting
	}

	function nextPage() {
		if ((currentPage + 1) * rowsPerPage < filteredData.length) {
			currentPage++;
		}
	}

	function prevPage() {
		if (currentPage > 0) {
			currentPage--;
		}
	}

	// Sort data
	const sortedData = $derived.by(() => {
		if (!sortColumn) return filteredData;

		const sorted = [...filteredData].sort((a, b) => {
			const aVal = a[sortColumn];
			const bVal = b[sortColumn];

			// Handle null/undefined
			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return 1;
			if (bVal == null) return -1;

			// Compare values
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
			}

			const aStr = String(aVal);
			const bStr = String(bVal);
			const comparison = aStr.localeCompare(bStr);
			return sortDirection === 'asc' ? comparison : -comparison;
		});

		return sorted;
	});

	const paginatedData = $derived(
		sortedData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)
	);
	const totalPages = $derived(Math.ceil(filteredData.length / rowsPerPage));
</script>

{#if isOpen}
	<!-- Modal Backdrop -->
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		onclick={closeModal}
		role="button"
		tabindex="0"
	>
		<!-- Modal Content -->
		<div
			class="bg-light-background dark:bg-dark-background rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between p-4 border-b border-light-fill dark:border-dark-fill"
			>
				<div class="flex-1">
					<h2 class="text-xl font-medium text-light-titulo dark:text-dark-titulo mb-1">
						Datos seleccionados
					</h2>
					{#if title.length > 0}
						<div class="text-sm text-light-focus-secondary dark:text-dark-focus-secondary">
							{title.join(' > ')}
						</div>
					{/if}
				</div>
				<button
					onclick={closeModal}
					class="p-2 hover:bg-light-fill dark:hover:bg-dark-fill rounded transition-colors"
					aria-label="Cerrar"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-auto p-4">
				{#if filteredData.length === 0}
					<div class="flex justify-center items-center h-64">
						<div class="text-lg text-light-titulo dark:text-dark-titulo">No hay datos disponibles</div>
					</div>
				{:else}
					<!-- Table -->
					<div class="overflow-x-auto rounded border border-light-fill dark:border-dark-fill">
						<table class="w-full text-sm">
							<thead class="bg-light-fill dark:bg-dark-fill">
								<tr>
									{#each columnHeaders as header, i}
										<th
											class="px-4 py-3 text-left font-medium text-light-titulo dark:text-dark-titulo sticky top-0 bg-light-fill dark:bg-dark-fill cursor-pointer hover:bg-opacity-80 select-none"
											onclick={() => sortByColumn(columns[i])}
										>
											<div class="flex items-center gap-2">
												<span>{header}</span>
												<div class="flex flex-col">
													<svg class="w-3 h-3 {sortColumn === columns[i] && sortDirection === 'asc' ? 'text-light-focus-primary dark:text-dark-focus-primary' : 'text-light-focus-secondary dark:text-dark-focus-secondary opacity-40'}" fill="currentColor" viewBox="0 0 20 20">
														<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" transform="rotate(180 10 10)"/>
													</svg>
													<svg class="w-3 h-3 -mt-1 {sortColumn === columns[i] && sortDirection === 'desc' ? 'text-light-focus-primary dark:text-dark-focus-primary' : 'text-light-focus-secondary dark:text-dark-focus-secondary opacity-40'}" fill="currentColor" viewBox="0 0 20 20">
														<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
													</svg>
												</div>
											</div>
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each paginatedData as row, i}
									<tr
										class="border-t border-light-fill dark:border-dark-fill hover:bg-light-fill dark:hover:bg-dark-fill transition-colors"
									>
										{#each columns as column}
											<td class="px-4 py-2 text-light-titulo dark:text-dark-titulo">
												{#if column === 'fecha' || column === '4'}
													{row[column] ? new Date(row[column]).toISOString().split('T')[0] : ''}
												{:else}
													{row[column] ?? ''}
												{/if}
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Pagination -->
					<div class="flex items-center justify-between mt-4">
						<div class="text-sm text-light-focus-secondary dark:text-dark-focus-secondary">
							Mostrando {currentPage * rowsPerPage + 1} - {Math.min(
								(currentPage + 1) * rowsPerPage,
								filteredData.length
							)} de {filteredData.length} registros
						</div>
						<div class="flex gap-2">
							<button
								onclick={prevPage}
								disabled={currentPage === 0}
								class="px-4 py-2 rounded border border-light-fill dark:border-dark-fill hover:bg-light-fill dark:hover:bg-dark-fill transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Anterior
							</button>
							<div class="px-4 py-2 text-sm text-light-titulo dark:text-dark-titulo">
								Página {currentPage + 1} de {totalPages}
							</div>
							<button
								onclick={nextPage}
								disabled={(currentPage + 1) * rowsPerPage >= filteredData.length}
								class="px-4 py-2 rounded border border-light-fill dark:border-dark-fill hover:bg-light-fill dark:hover:bg-dark-fill transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Siguiente
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
