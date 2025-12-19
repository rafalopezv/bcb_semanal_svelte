import * as d3 from 'd3';

export async function load({ fetch }) {
	try {
		// Fetch the CSV file directly from GitHub raw URL (server-side, no CORS issues)
		const response = await fetch('https://raw.githubusercontent.com/mauforonda/bcb_semanal/refs/heads/main/datos.csv');
		const csvText = await response.text();

		// Parse the CSV data
		const csvData = d3.csvParse(csvText, (d) => ({
			unidad: d.unidad,
			categoria: d.categoria,
			variable: d.variable,
			subvariable: d.subvariable,
			fecha: d.fecha,
			valor: +d.valor
		}));

		return {
			csvData
		};
	} catch (error) {
		console.error('Error loading data:', error);
		return {
			csvData: []
		};
	}
}
