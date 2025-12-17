<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	let { data = [], isDark = false, title = [], showTitle = true, tooltip = $bindable({ visible: false, x: 0, y: 0, fecha: '', valor: '', unidad: '' }) } = $props();

	let chartContainer;
	let isAnimating = $state(false);

	const colors = $derived(
		isDark
			? {
					frame: '#8a8a8a',
					background: '#151515',
					line: '#c9a896',
					fill: '#4a3a30',
					focus_primary: '#d4a574',      // Ámbar dorado vibrante (círculo hover)
					focus_secondary: '#b0b0b0',
					focus_stroke: '#c9a896',       // Ámbar suave (borde círculo)
					border: '#151515'
				}
			: {
					frame: '#8a8a8a',
					background: '#ffffff',
					line: '#2d4a52',
					fill: '#d3d8da',
					focus_primary: '#4a8896',      // Teal vibrante (círculo hover)
					focus_secondary: '#6b6b6b',
					focus_stroke: '#2d4a52',       // Teal oscuro (borde círculo)
					border: '#d3d8da'
				}
	);

	const formatoFecha = new Intl.DateTimeFormat('es', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC'
	});

	function createChart() {
		if (!chartContainer || !data.length) {
			return;
		}

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const unidad = data[0]?.unidad || '';

		// Aggregate data by date
		const serie = d3
			.rollups(
				data,
				(v) => d3.sum(v, (d) => d.valor),
				(d) => new Date(d.fecha)
			)
			.map(([fecha, valor]) => ({ fecha, valor }))
			.sort((a, b) => a.fecha - b.fecha);

		// Dimensions - responsive to container size
		const containerWidth = chartContainer.clientWidth;
		const containerHeight = chartContainer.clientHeight;
		const isMobile = containerWidth < 768;
		const width = containerWidth; // Use full container width
		const height = containerHeight || (isMobile ? 500 : 700); // Use container height or fallback

		const margin = {
			top: showTitle ? 80 : 20,
			right: isMobile ? 50 : 70,
			bottom: isMobile ? 30 : 40,
			left: isMobile ? 10 : 30
		};
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		// Scales
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(serie, (d) => d.fecha))
			.range([0, innerWidth]);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(serie, (d) => d.valor)])
			.nice()
			.range([innerHeight, 0]);

		// SVG
		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.attr('class', 'rounded')
			.style('background-color', colors.background);

		const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Multi-line title inside chart (only if showTitle is true)
		if (showTitle) {
			const titleLines = Array.isArray(title) ? title : [title];
			const lineHeight = isMobile ? 18 : 20;
			const baseFontSize = isMobile ? '14px' : '16px';

			titleLines.forEach((line, i) => {
				g.append('text')
					.attr('x', 0)
					.attr('y', -50 + i * lineHeight)
					.attr('text-anchor', 'start')
					.attr('fill', colors.line)
					.style('font-size',
						i === 1 ? (isMobile ? '15px' : '17px') :
						i === 2 ? (isMobile ? '12px' : '14px') :
						baseFontSize)
					.style('font-weight',
						i === 1 ? 600 :
						i === 2 ? 300 :
						400)
					.style('letter-spacing', '-0.01em')
					.style('opacity',
						i === 1 ? 1 :
						i === 2 ? 0.65 :
						0.85)
					.text(line);
			});
		}

		// Grid
		g.append('g')
			.attr('class', 'grid')
			.selectAll('line')
			.data(yScale.ticks())
			.join('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('y1', (d) => yScale(d))
			.attr('y2', (d) => yScale(d))
			.attr('stroke', colors.frame)
			.attr('stroke-opacity', isDark ? 0.4 : 0.35)
			.attr('stroke-dasharray', '2 2');

		// Area
		const area = d3
			.area()
			.x((d) => xScale(d.fecha))
			.y0(innerHeight)
			.y1((d) => yScale(d.valor))
			.curve(d3.curveMonotoneX);

		// Full area (will be hidden on hover)
		const fullArea = g
			.append('path')
			.datum(serie)
			.attr('class', 'full-area')
			.attr('fill', colors.fill)
			.attr('fill-opacity', 0.5)
			.attr('d', area);

		// Hover area - active portion (from start to hover point)
		const hoverArea = g
			.append('path')
			.attr('class', 'hover-area')
			.attr('fill', colors.fill)
			.attr('fill-opacity', 0.65)
			.style('display', 'none');

		// Future area - faded portion (from hover point to end)
		const futureArea = g
			.append('path')
			.attr('class', 'future-area')
			.attr('fill', colors.fill)
			.attr('fill-opacity', 0.20)
			.style('display', 'none');

		// Line
		const line = d3
			.line()
			.x((d) => xScale(d.fecha))
			.y((d) => yScale(d.valor))
			.curve(d3.curveMonotoneX);

		// Full line (will be hidden on hover)
		const fullLine = g
			.append('path')
			.datum(serie)
			.attr('class', 'full-line')
			.attr('fill', 'none')
			.attr('stroke', colors.line)
			.attr('stroke-width', 2.5)
			.attr('d', line);

		// End point - permanent dot at the last data point
		if (serie.length > 0) {
			const lastPoint = serie[serie.length - 1];
			g.append('circle')
				.attr('class', 'end-point')
				.attr('cx', xScale(lastPoint.fecha))
				.attr('cy', yScale(lastPoint.valor))
				.attr('r', 6)
				.attr('fill', colors.focus_primary)
				.attr('stroke', colors.focus_stroke)
				.attr('stroke-width', 2.5);
		}

		// Hover line - active portion (from start to hover point)
		const hoverLine = g
			.append('path')
			.attr('class', 'hover-line')
			.attr('fill', 'none')
			.attr('stroke', colors.line)
			.attr('stroke-width', 2.5)
			.style('display', 'none');

		// Future line - removed, not shown in the faded area

		// Axes
		const xAxis = d3
			.axisBottom(xScale)
			.ticks(isMobile ? 4 : 8)
			.tickSize(0)
			.tickPadding(isMobile ? 8 : 22);

		const miles = d3.max(serie, (d) => d.valor) > 1e4;
		const formatter = miles ? (d) => d / 1e3 : (d) => d;
		const suffix = miles ? 'mil' : '';

		const yAxis = d3
			.axisRight(yScale)
			.tickSize(0)
			.tickPadding(16)
			.tickFormat((d, i, nodes) => {
				if (i === nodes.length - 1) return `${formatter(d)} ${suffix}`;
				if (d === 0) return '';
				return formatter(d);
			});

		g.append('g')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(xAxis)
			.attr('color', colors.line)
			.selectAll('text')
			.style('font-weight', 500)
			.style('font-size', '14px');

		g.append('g')
			.attr('transform', `translate(${innerWidth - 5},10)`)
			.call(yAxis)
			.attr('color', colors.line)
			.call((g) => g.select('.domain').remove())
			.selectAll('text')
			.style('font-weight', 500)
			.style('font-size', '14px');

		// Unit label removed - now shown in tooltip only

		// Interactive overlay
		const bisect = d3.bisector((d) => d.fecha).left;

		const focus = g.append('g').style('display', 'none');

		focus
			.append('circle')
			.attr('r', 6)
			.attr('fill', colors.focus_primary)
			.attr('stroke', colors.focus_stroke)
			.attr('stroke-width', 2.5);

		focus
			.append('line')
			.attr('class', 'vertical-line')
			.attr('y1', 0)
			.attr('y2', innerHeight)
			.attr('stroke', colors.line)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '3 2')
			.attr('stroke-opacity', 0.4);

		const overlay = svg
			.append('rect')
			.attr('transform', `translate(${margin.left},${margin.top})`)
			.attr('width', innerWidth)
			.attr('height', innerHeight)
			.attr('fill', 'none')
			.attr('pointer-events', 'all');

		overlay
			.on('mouseover', () => {
				focus.style('display', null);
				fullLine.style('display', 'none');
				fullArea.style('display', 'none');
				hoverLine.style('display', null);
				hoverArea.style('display', null);
				futureArea.style('display', null);
				g.select('.end-point').style('display', 'none');
			})
			.on('mouseout', () => {
				focus.style('display', 'none');
				tooltip.visible = false;
				fullLine.style('display', null);
				fullArea.style('display', null);
				hoverLine.style('display', 'none');
				hoverArea.style('display', 'none');
				futureArea.style('display', 'none');
				g.select('.end-point').style('display', null);
			})
			.on('mousemove', function (event) {
				const [xPos] = d3.pointer(event);
				const x0 = xScale.invert(xPos);
				const i = bisect(serie, x0, 1);
				const d0 = serie[i - 1];
				const d1 = serie[i];
				const d = d1 && x0 - d0.fecha > d1.fecha - x0 ? d1 : d0;

				if (d) {
					const hoverIndex = serie.indexOf(d);
					const pastData = serie.slice(0, hoverIndex + 1);
					const futureData = serie.slice(hoverIndex);

					// Update hover portion (past - from start to hover point)
					hoverLine.datum(pastData).attr('d', line);
					hoverArea.datum(pastData).attr('d', area);

					// Update future portion (from hover point to end) - only area, no line
					futureArea.datum(futureData).attr('d', area);

					focus.attr('transform', `translate(${xScale(d.fecha)},${yScale(d.valor)})`);
					focus.select('.vertical-line')
						.attr('y1', -yScale(d.valor))
						.attr('y2', innerHeight - yScale(d.valor));

					// Update tooltip with data only (position is fixed in template)
					tooltip = {
						visible: true,
						x: 0, // Not used, position is fixed
						y: 0, // Not used, position is fixed
						fecha: formatoFecha.format(d.fecha),
						valor: d.valor.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
						unidad
					};
				}
			});

		// Show tooltip with last data point on initial render
		if (serie.length > 0) {
			const lastDataPoint = serie[serie.length - 1];
			tooltip = {
				visible: true,
				x: 0,
				y: 0,
				fecha: formatoFecha.format(lastDataPoint.fecha),
				valor: lastDataPoint.valor.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
				unidad
			};
		}
	}

	// Debounced chart update to prevent too many redraws
	let updateTimeout;
	$effect(() => {
		// Watch both data and isDark for changes
		if (chartContainer && data.length > 0) {
			// Access isDark to make it a dependency
			const theme = isDark;
			clearTimeout(updateTimeout);
			updateTimeout = setTimeout(() => {
				createChart();
			}, 50); // Small delay to batch rapid changes
		}
	});

	onMount(() => {
		const resizeObserver = new ResizeObserver(() => {
			createChart();
		});
		resizeObserver.observe(chartContainer);
		return () => {
			clearTimeout(updateTimeout);
			resizeObserver.disconnect();
		};
	});
</script>

<div class="w-full h-full">
	<div bind:this={chartContainer} class="w-full h-full animate-fadeIn"></div>
</div>
