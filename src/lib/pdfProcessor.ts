// src/lib/pdfProcessor.ts
import type { FileContent } from '@/types';

const EXTRACTION_CONFIG = {
	maxPages: 50,
	timeout: 30000,
	minTextLength: 10,
};

// Función principal que intenta múltiples métodos
export async function extractTextFromPDF(file: File): Promise<string> {
	if (typeof window === 'undefined') {
		throw new Error('PDF processing solo disponible en el cliente');
	}

	// Intentar método 1: PDF.js con CDN
	try {
		return await extractWithPDFJS(file);
	} catch (error) {
		console.warn('PDF.js falló, intentando método alternativo:', error);

		// Intentar método 2: Procesamiento básico
		try {
			return await extractTextFromPDFBasic(file);
		} catch (fallbackError) {
			console.warn('Procesamiento básico falló:', fallbackError);

			// Método 3: Contenido placeholder
			return generatePDFPlaceholder(file);
		}
	}
}

// Método 1: PDF.js con configuración robusta
async function extractWithPDFJS(file: File): Promise<string> {
	return new Promise(async (resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error('Timeout procesando PDF con PDF.js'));
		}, EXTRACTION_CONFIG.timeout);

		try {
			// Importación dinámica
			const pdfjs = await import('pdfjs-dist');

			// Configurar worker usando CDN
			pdfjs.GlobalWorkerOptions.workerSrc =
				'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

			const arrayBuffer = await file.arrayBuffer();
			const loadingTask = pdfjs.getDocument({
				data: arrayBuffer,
				verbosity: 0,
				useSystemFonts: false,
				disableFontFace: true,
			});

			const pdf = await loadingTask.promise;
			let fullText = '';
			const maxPages = Math.min(pdf.numPages, EXTRACTION_CONFIG.maxPages);

			for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
				try {
					const page = await pdf.getPage(pageNum);
					const textContent = await page.getTextContent();

					const pageText = textContent.items
						.filter((item: any) => item.str && item.str.trim())
						.map((item: any) => item.str)
						.join(' ');

					if (pageText.trim().length > 0) {
						fullText += `\n\n=== PÁGINA ${pageNum} ===\n${pageText}`;
					}
				} catch (pageError) {
					console.warn(`Error procesando página ${pageNum}:`, pageError);
				}
			}

			clearTimeout(timeoutId);

			if (fullText.trim().length < EXTRACTION_CONFIG.minTextLength) {
				throw new Error('No se pudo extraer suficiente texto del PDF');
			}

			resolve(fullText);
		} catch (error) {
			clearTimeout(timeoutId);
			reject(error);
		}
	});
}

// Método 2: Procesamiento básico (fallback)
export async function extractTextFromPDFBasic(file: File): Promise<string> {
	try {
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);

		// Buscar patrones de texto
		const patterns = [
			/\(([^)]{3,})\)/g,
			/\[([^\]]{3,})\]/g,
			/\/([A-Za-z0-9\s]{3,})\s/g,
			/BT\s+([^ET]+)\s+ET/g,
			/Tj\s*\(([^)]+)\)/g,
		];

		let extractedText = '';
		let bestMatch = '';

		for (const pattern of patterns) {
			const matches = text.match(pattern);
			if (matches && matches.length > 0) {
				const cleanedMatches = matches
					.map((match) => match.replace(/[()[\]/BT ET Tj]/g, ''))
					.filter((text) => text.trim().length > 2)
					.join(' ');

				if (cleanedMatches.length > bestMatch.length) {
					bestMatch = cleanedMatches;
				}
			}
		}

		if (bestMatch.length > EXTRACTION_CONFIG.minTextLength) {
			return bestMatch;
		}

		throw new Error('No se pudo extraer texto usando procesamiento básico');
	} catch (error) {
		throw new Error(`Error en procesamiento básico: ${error}`);
	}
}

// Método 3: Placeholder informativo
function generatePDFPlaceholder(file: File): string {
	return `[PDF: ${file.name}]

NOTA IMPORTANT: Aquest PDF no s'ha pogut processar automàticament.

Possibles causes:
- El PDF conté text en format d'imatge (escanejat)
- El PDF està protegit o xifrat
- El PDF utilitza fonts o codificació especial
- Error temporal en el sistema de processament

RECOMANACIONS:
1. Converteix el PDF a format text seleccionable
2. Utilitza un PDF no protegit
3. Prova amb un document Word (.docx) si és possible
4. Verifica que el text del PDF es pot seleccionar manualment

El sistema continuarà amb l'avaluació utilitzant la informació disponible dels altres documents.`;
}

// Función para procesar archivos Word
export async function processWordFile(file: File): Promise<string> {
	try {
		const mammoth = await import('mammoth');
		const arrayBuffer = await file.arrayBuffer();
		const result = await mammoth.extractRawText({ arrayBuffer });

		if (result.value.length < EXTRACTION_CONFIG.minTextLength) {
			throw new Error('Documento Word vacío o sin contenido legible');
		}

		return result.value;
	} catch (error) {
		console.error('Error processing Word file:', error);
		throw new Error(`Error procesando documento Word: ${error}`);
	}
}

// Función principal para procesar archivos
export async function processFile(file: File): Promise<string> {
	try {
		console.log(`Procesando archivo: ${file.name}, tipo: ${file.type}`);

		// Verificar tamaño
		if (file.size > 10 * 1024 * 1024) {
			throw new Error('Archivo demasiado grande (máximo 10MB)');
		}

		if (file.type === 'application/pdf') {
			console.log('Procesando PDF...');
			const text = await extractTextFromPDF(file);
			console.log(`Texto extraído del PDF: ${text.substring(0, 10000)} `);
			return cleanExtractedText(text);
		} else if (file.type.includes('word') || file.name.endsWith('.docx')) {
			console.log('Procesando documento Word...');
			const text = await processWordFile(file);
			return cleanExtractedText(text);
		} else if (file.type === 'text/plain') {
			console.log('Procesando archivo de texto plano...');
			const text = await file.text();

			if (text.length < EXTRACTION_CONFIG.minTextLength) {
				throw new Error('Archivo de texto vacío');
			}

			return cleanExtractedText(text);
		} else {
			throw new Error(`Tipo de archivo no soportado: ${file.type}`);
		}
	} catch (error) {
		console.error('Error processing file:', error);
		throw new Error(
			`Error procesando ${file.name}: ${
				error instanceof Error ? error.message : 'Error desconocido'
			}`,
		);
	}
}

// Función para validar el contenido extraído
export function validateExtractedContent(
	content: string,
	filename: string,
): boolean {
	if (!content || content.trim().length < EXTRACTION_CONFIG.minTextLength) {
		console.warn(
			`Contenido insuficiente en ${filename}: ${content.length} caracteres`,
		);
		return false;
	}

	const meaningfulContent = content.replace(/[\s\n\r\t]/g, '').length;
	if (meaningfulContent < EXTRACTION_CONFIG.minTextLength) {
		console.warn(`Contenido sin significado en ${filename}`);
		return false;
	}

	return true;
}

// Función para limpiar texto
export function cleanExtractedText(text: string): string {
	return text
		.replace(/\s+/g, ' ')
		.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
		.replace(/\n\s*\n/g, '\n\n')
		.trim();
}

// Funciones para el servidor
export async function processFileServer(
	fileContent: string,
	filename: string,
): Promise<string> {
	if (
		!fileContent ||
		fileContent.trim().length < EXTRACTION_CONFIG.minTextLength
	) {
		throw new Error(`Contenido insuficiente en ${filename}`);
	}
	return cleanExtractedText(fileContent);
}

export async function processServerFiles(
	files: FileContent[],
): Promise<FileContent[]> {
	const processedFiles: FileContent[] = [];

	for (const file of files) {
		try {
			const cleanContent = await processFileServer(file.content, file.name);
			processedFiles.push({ ...file, content: cleanContent });
		} catch (error) {
			console.error(`Error processing ${file.name}:`, error);
			processedFiles.push(file);
		}
	}

	return processedFiles;
}

// Función utilitaria
export function getFileInfo(file: File) {
	return {
		name: file.name,
		type: file.type,
		size: file.size,
		extension: file.name.split('.').pop()?.toLowerCase(),
		isSupported: ['pdf', 'docx', 'doc', 'txt'].includes(
			file.name.split('.').pop()?.toLowerCase() || '',
		),
	};
}
