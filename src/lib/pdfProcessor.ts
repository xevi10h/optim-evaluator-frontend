// src/lib/pdfProcessor.ts
import type { FileContent } from '@/types';
import { extractTextFromPDFAdvanced } from './pdfAdvancedProcessor';

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

	// Intentar método 1: Procesador avanzado de PDF.js
	try {
		console.log('Intentando extraer texto con procesador avanzado...');
		return await extractTextFromPDFAdvanced(file);
	} catch (error) {
		console.warn('Procesador avanzado falló:', error);

		// Intentar método 2: PDF.js estándar
		try {
			console.log('Intentando método estándar de PDF.js...');
			return await extractWithPDFJS(file);
		} catch (fallbackError) {
			console.warn('PDF.js estándar falló:', fallbackError);

			// Método 3: Contenido placeholder
			return generatePDFPlaceholder(file);
		}
	}
}

// Método 2: PDF.js estándar con configuración mejorada
async function extractWithPDFJS(file: File): Promise<string> {
	return new Promise(async (resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error('Timeout procesando PDF con PDF.js'));
		}, EXTRACTION_CONFIG.timeout);

		try {
			// Importación dinámica de pdfjs-dist
			const pdfjsLib = await import('pdfjs-dist');

			// Asegurar que el worker esté configurado
			if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
				pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
			}

			// Convertir archivo a ArrayBuffer
			const arrayBuffer = await file.arrayBuffer();

			// Cargar el documento
			const loadingTask = pdfjsLib.getDocument({
				data: arrayBuffer,
				cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
				cMapPacked: true,
			});

			const pdf = await loadingTask.promise;
			let fullText = '';
			const maxPages = Math.min(pdf.numPages, EXTRACTION_CONFIG.maxPages);

			console.log(`PDF cargado: ${pdf.numPages} páginas`);

			for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
				try {
					const page = await pdf.getPage(pageNum);
					const textContent = await page.getTextContent();

					// Procesar items de texto
					const textItems = textContent.items as any[];
					let pageText = '';

					// Agrupar por líneas
					const lines: { [key: number]: any[] } = {};

					textItems.forEach((item) => {
						if (item.str) {
							const y = Math.round(item.transform[5]);
							if (!lines[y]) lines[y] = [];
							lines[y].push(item);
						}
					});

					// Ordenar líneas y construir texto
					const sortedYs = Object.keys(lines)
						.map(Number)
						.sort((a, b) => b - a);

					sortedYs.forEach((y, index) => {
						const lineItems = lines[y].sort(
							(a: any, b: any) => a.transform[4] - b.transform[4],
						);
						const lineText = lineItems.map((item: any) => item.str).join(' ');

						if (index > 0 && sortedYs[index - 1] - y > 10) {
							pageText += '\n\n';
						} else if (index > 0) {
							pageText += '\n';
						}

						pageText += lineText;
					});

					if (pageText.trim()) {
						fullText += `\n\n=== PÀGINA ${pageNum} ===\n${pageText}`;
					}

					console.log(`Página ${pageNum} procesada correctamente`);
				} catch (pageError) {
					console.warn(`Error procesando página ${pageNum}:`, pageError);
				}
			}

			clearTimeout(timeoutId);

			if (fullText.trim().length < EXTRACTION_CONFIG.minTextLength) {
				throw new Error('No se pudo extraer suficiente texto del PDF');
			}

			console.log(`Texto total extraído: ${fullText.length} caracteres`);
			resolve(fullText);
		} catch (error) {
			clearTimeout(timeoutId);
			console.error('Error en PDF.js:', error);
			reject(error);
		}
	});
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

		if (
			file.type === 'application/pdf' ||
			file.name.toLowerCase().endsWith('.pdf')
		) {
			console.log('Procesando PDF...');
			const text = await extractTextFromPDF(file);
			console.log(`Texto extraído del PDF: ${text.substring(0, 200)}...`);
			return cleanExtractedText(text);
		} else if (
			file.type.includes('word') ||
			file.name.toLowerCase().endsWith('.docx') ||
			file.name.toLowerCase().endsWith('.doc')
		) {
			console.log('Procesando documento Word...');
			const text = await processWordFile(file);
			return cleanExtractedText(text);
		} else if (
			file.type === 'text/plain' ||
			file.name.toLowerCase().endsWith('.txt')
		) {
			console.log('Procesando archivo de texto plano...');
			const text = await file.text();

			if (text.length < EXTRACTION_CONFIG.minTextLength) {
				throw new Error('Archivo de texto vacío');
			}

			return cleanExtractedText(text);
		} else {
			throw new Error(
				`Tipo de archivo no soportado: ${file.type || 'desconocido'}`,
			);
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

	// Verificar que no sea solo caracteres especiales o basura
	const meaningfulContent = content.replace(
		/[^a-zA-Z0-9àèéíòóúÀÈÉÍÒÓÚñÑçÇ]/g,
		'',
	).length;
	if (meaningfulContent < EXTRACTION_CONFIG.minTextLength) {
		console.warn(`Contenido sin significado en ${filename}`);
		return false;
	}

	return true;
}

// Función mejorada para limpiar texto
export function cleanExtractedText(text: string): string {
	return (
		text
			// Normalizar espacios y saltos de línea
			.replace(/\r\n/g, '\n')
			.replace(/\r/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			.replace(/[ \t]+/g, ' ')
			// Eliminar caracteres de control
			.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
			// Limpiar caracteres especiales mal decodificados
			.replace(/�/g, '')
			// Trim de cada línea
			.split('\n')
			.map((line) => line.trim())
			.join('\n')
			// Eliminar líneas vacías consecutivas
			.replace(/\n{2,}/g, '\n\n')
			.trim()
	);
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

// Función utilitaria mejorada
export function getFileInfo(file: File) {
	const extension = file.name.split('.').pop()?.toLowerCase() || '';
	const isSupported = ['pdf', 'docx', 'doc', 'txt'].includes(extension);

	return {
		name: file.name,
		type: file.type || 'unknown',
		size: file.size,
		extension,
		isSupported,
		sizeFormatted: formatFileSize(file.size),
	};
}

// Función para formatear tamaño de archivo
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
