<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	let { data = [], isDark = false, title = [] } = $props();

	let chartContainer;
	let tooltip = $state({ visible: false, x: 0, y: 0, fecha: '', valor: '', unidad: '' });
	let isAnimating = $state(false);

	const colors = $derived(
		isDark
			? {
					frame: '#60789d',
					background: '#15202c',
					line: '#78c2f6',
					fill: '#324d69',
					focus_primary: '#1c9af1',
					focus_secondary: '#87a5c5'
				}
			: {
					frame: '#bdbdbd',
					background: '#ffffff',
					line: '#5a7d5f',
					fill: '#e8f0e9',
					focus_primary: '#1a1a1a',
					focus_secondary: '#6b6b6b'
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

		// Trigger drawing animation
		isAnimating = true;

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

		// Dimensions
		const containerWidth = chartContainer.clientWidth;
		const isMobile = containerWidth < 768;
		const width = isMobile ? containerWidth : Math.min(980, containerWidth);
		const height = isMobile ? 450 : 650;

		const margin = { top: 80, right: 70, bottom: 40, left: 30 };
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
			.attr('class', 'rounded border')
			.style('border-color', colors.fill)
			.style('background-color', colors.background);

		const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Multi-line title inside chart
		const titleLines = Array.isArray(title) ? title : [title];
		const lineHeight = isMobile ? 18 : 20;
		const baseFontSize = isMobile ? '14px' : '16px';

		titleLines.forEach((line, i) => {
			g.append('text')
				.attr('x', 0)
				.attr('y', -50 + (i * lineHeight))
				.attr('text-anchor', 'start')
				.attr('fill', colors.line)
				.style('font-size', i === 1 ? (isMobile ? '15px' : '17px') : baseFontSize)
				.style('font-weight', i === 1 ? 600 : 400)
				.style('letter-spacing', '-0.01em')
				.style('opacity', i === 1 ? 1 : 0.85)
				.text(line);
		});

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
			.attr('stroke-opacity', isDark ? 0.35 : 0.25)
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
			.attr('fill-opacity', 0.5)
			.style('display', 'none');

		// Future area - faded portion (from hover point to end)
		const futureArea = g
			.append('path')
			.attr('class', 'future-area')
			.attr('fill', colors.fill)
			.attr('fill-opacity', 0.30)
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
			.attr('stroke-width', 2)
			.attr('d', line);

		// Hover line - active portion (from start to hover point)
		const hoverLine = g
			.append('path')
			.attr('class', 'hover-line')
			.attr('fill', 'none')
			.attr('stroke', colors.line)
			.attr('stroke-width', 2)
			.style('display', 'none');

		// Future line - removed, not shown in the faded area

		// Axes
		const xAxis = d3.axisBottom(xScale).tickSize(0).tickPadding(10);

		const miles = d3.max(serie, (d) => d.valor) > 1e4;
		const formatter = miles ? (d) => d / 1e3 : (d) => d;
		const suffix = miles ? 'mil' : '';

		const yAxis = d3
			.axisRight(yScale)
			.tickSize(0)
			.tickPadding(10)
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

		// Unit label (top right)
		g.append('text')
			.attr('x', innerWidth - 5)
			.attr('y', -10)
			.attr('text-anchor', 'end')
			.attr('fill', colors.line)
			.style('font-size', '13px')
			.style('font-weight', 600)
			.text(unidad);

		// Drawing animation - simulate hover effect traveling left to right
		if (isAnimating) {
			const animationDuration = 1200; // 1.2 seconds
			const steps = 60; // 60 frames
			const stepDuration = animationDuration / steps;

			let currentStep = 0;

			const animationInterval = setInterval(() => {
				if (currentStep >= steps) {
					clearInterval(animationInterval);
					isAnimating = false;
					// Reset to full view
					fullLine.style('display', null);
					fullArea.style('display', null);
					hoverLine.style('display', 'none');
					hoverArea.style('display', 'none');
					futureArea.style('display', 'none');
					return;
				}

				const progress = currentStep / steps;
				const targetIndex = Math.floor(progress * serie.length);

				if (targetIndex > 0 && targetIndex < serie.length) {
					const pastData = serie.slice(0, targetIndex + 1);
					const futureData = serie.slice(targetIndex);

					// Hide full line/area during animation
					fullLine.style('display', 'none');
					fullArea.style('display', 'none');

					// Show animated portions
					hoverLine.style('display', null).datum(pastData).attr('d', line);
					hoverArea.style('display', null).datum(pastData).attr('d', area);
					futureArea.style('display', null).datum(futureData).attr('d', area);
				}

				currentStep++;
			}, stepDuration);
		}

		// Interactive overlay
		const bisect = d3.bisector((d) => d.fecha).left;

		const focus = g.append('g').style('display', 'none');

		focus
			.append('circle')
			.attr('r', 5)
			.attr('fill', colors.focus_primary)
			.attr('stroke', colors.line)
			.attr('stroke-width', 2);

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
			})
			.on('mouseout', () => {
				focus.style('display', 'none');
				tooltip.visible = false;
				fullLine.style('display', null);
				fullArea.style('display', null);
				hoverLine.style('display', 'none');
				hoverArea.style('display', 'none');
				futureArea.style('display', 'none');
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

					tooltip = {
						visible: true,
						x: event.pageX,
						y: event.pageY,
						fecha: formatoFecha.format(d.fecha),
						valor: d.valor.toLocaleString('es-ES'),
						unidad
					};
				}
			});
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

<div class="w-full">
	<div bind:this={chartContainer} class="w-full animate-fadeIn"></div>

	{#if tooltip.visible}
		<div
			class="fixed pointer-events-none z-50 bg-light-background dark:bg-dark-background border border-light-fill dark:border-dark-fill rounded p-3 shadow-sm"
			style="left: {tooltip.x + 10}px; top: {tooltip.y - 50}px;"
		>
			<div class="text-xs font-medium text-light-titulo dark:text-dark-titulo opacity-70 dark:opacity-60">
				{tooltip.fecha}
			</div>
			<div class="text-xl font-semibold text-light-titulo dark:text-dark-titulo">
				{tooltip.valor}
			</div>
			<div class="text-xs font-medium text-light-titulo dark:text-dark-titulo opacity-70 dark:opacity-60">
				{tooltip.unidad}
			</div>
		</div>
	{/if}
</div>
