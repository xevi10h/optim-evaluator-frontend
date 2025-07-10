// src/lib/pdfAdvancedProcessor.ts
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import type {
	PDFDocumentProxy,
	PDFPageProxy,
	TextContent,
} from 'pdfjs-dist/types/src/display/api';

// Configuración avanzada para PDF.js
export const PDF_CONFIG = {
	workerSrc: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`,
	cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/cmaps/`,
	standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/standard_fonts/`,
	verbosity: 0,
	disableFontFace: false,
	useSystemFonts: true,
	cMapPacked: true,
};

// Inicializar worker globalmente
if (typeof window !== 'undefined' && !GlobalWorkerOptions.workerSrc) {
	GlobalWorkerOptions.workerSrc = PDF_CONFIG.workerSrc;
}

interface ExtractedPage {
	pageNumber: number;
	text: string;
	confidence: number;
}

export async function extractTextFromPDFAdvanced(file: File): Promise<string> {
	try {
		console.log(`[PDF Advanced] Procesando: ${file.name}`);

		// Convertir a ArrayBuffer
		const arrayBuffer = await file.arrayBuffer();

		// Cargar el documento con configuración completa
		const loadingTask = getDocument({
			data: arrayBuffer,
			cMapUrl: PDF_CONFIG.cMapUrl,
			cMapPacked: PDF_CONFIG.cMapPacked,
			standardFontDataUrl: PDF_CONFIG.standardFontDataUrl,
			verbosity: PDF_CONFIG.verbosity,
			disableFontFace: PDF_CONFIG.disableFontFace,
			useSystemFonts: PDF_CONFIG.useSystemFonts,
			// Opciones adicionales para mejorar la extracción
			isEvalSupported: true,
			disableAutoFetch: false,
			disableStream: false,
			disableRange: false,
		});

		const pdf: PDFDocumentProxy = await loadingTask.promise;
		console.log(`[PDF Advanced] Documento cargado: ${pdf.numPages} páginas`);

		const extractedPages: ExtractedPage[] = [];

		// Procesar todas las páginas
		for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
			try {
				const page: PDFPageProxy = await pdf.getPage(pageNum);
				const textContent: TextContent = await page.getTextContent({
					includeMarkedContent: true,
				});

				// Extraer y organizar el texto con mejor formateo
				const pageText = await extractPageText(textContent, page);

				if (pageText.text.trim()) {
					extractedPages.push({
						pageNumber: pageNum,
						text: pageText.text,
						confidence: pageText.confidence,
					});

					console.log(
						`[PDF Advanced] Página ${pageNum} extraída: ${pageText.text.substring(
							0,
							100,
						)}...`,
					);
				}
			} catch (pageError) {
				console.error(`[PDF Advanced] Error en página ${pageNum}:`, pageError);
			}
		}

		// Combinar el texto de todas las páginas
		const fullText = extractedPages
			.sort((a, b) => a.pageNumber - b.pageNumber)
			.map((page) => `\n\n=== PÀGINA ${page.pageNumber} ===\n${page.text}`)
			.join('');

		// Validar el resultado
		if (fullText.trim().length < 50) {
			throw new Error('No se pudo extraer suficiente texto del PDF');
		}

		const avgConfidence =
			extractedPages.reduce((sum, page) => sum + page.confidence, 0) /
			extractedPages.length;
		console.log(
			`[PDF Advanced] Extracción completada. Confianza promedio: ${avgConfidence.toFixed(
				2,
			)}%`,
		);

		return fullText;
	} catch (error) {
		console.error('[PDF Advanced] Error fatal:', error);
		throw error;
	}
}

async function extractPageText(
	textContent: TextContent,
	page: PDFPageProxy,
): Promise<{ text: string; confidence: number }> {
	const textItems = textContent.items;
	const viewport = page.getViewport({ scale: 1.0 });

	// Agrupar elementos por línea basándose en la posición Y
	const lines = new Map<number, Array<any>>();

	for (const item of textItems) {
		if ('str' in item && item.str) {
			// Calcular la posición Y redondeada para agrupar elementos de la misma línea
			const y = Math.round(item.transform[5]);

			if (!lines.has(y)) {
				lines.set(y, []);
			}

			lines.get(y)!.push({
				text: item.str,
				x: item.transform[4],
				width: item.width || 0,
				height: item.height || 0,
			});
		}
	}

	// Ordenar líneas por posición Y (de arriba a abajo)
	const sortedLines = Array.from(lines.entries()).sort((a, b) => b[0] - a[0]); // Y decrece de arriba a abajo en PDF

	// Construir el texto con formato adecuado
	let pageText = '';
	let lastY = null;
	let confidence = 100;

	for (const [y, lineItems] of sortedLines) {
		// Detectar saltos de párrafo
		if (lastY !== null && Math.abs(lastY - y) > 20) {
			pageText += '\n\n';
		} else if (lastY !== null) {
			pageText += '\n';
		}

		// Ordenar elementos de la línea por posición X
		lineItems.sort((a, b) => a.x - b.x);

		// Construir la línea con espacios apropiados
		let lineText = '';
		let lastX = null;

		for (const item of lineItems) {
			// Detectar espacios entre palabras
			if (lastX !== null) {
				const gap = item.x - lastX;
				if (gap > 5) {
					lineText += ' ';
				}
			}

			lineText += item.text;
			lastX = item.x + item.width;
		}

		pageText += lineText.trim();
		lastY = y;
	}

	// Calcular confianza basada en la cantidad de texto extraído
	if (pageText.length < 100) {
		confidence = 50;
	} else if (pageText.length < 500) {
		confidence = 75;
	} else {
		confidence = 95;
	}

	// Limpiar el texto
	pageText = pageText
		.replace(/\s+/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	return { text: pageText, confidence };
}

// Función auxiliar para detectar el encoding del PDF
export async function detectPDFEncoding(file: File): Promise<string> {
	try {
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer.slice(0, 1024)); // Primeros 1KB

		// Buscar indicadores de encoding
		const headerString = new TextDecoder('latin1').decode(uint8Array);

		if (headerString.includes('/Encoding /WinAnsiEncoding')) {
			return 'windows-1252';
		} else if (headerString.includes('/Encoding /MacRomanEncoding')) {
			return 'macintosh';
		} else if (headerString.includes('/UTF16')) {
			return 'utf-16';
		}

		return 'utf-8'; // Default
	} catch {
		return 'utf-8';
	}
}

// Función para procesar PDFs con OCR (placeholder para futura implementación)
export async function extractTextWithOCR(file: File): Promise<string> {
	console.warn('[PDF OCR] OCR no implementado. Usando extracción estándar.');
	return extractTextFromPDFAdvanced(file);
}
