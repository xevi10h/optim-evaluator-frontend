// src/lib/pdfProcessor.ts
import type { FileContent } from '@/types';

// Tipos para el procesamiento de archivos
// Los tipos principales están en @/types/index.ts

// Configuración para diferentes tipos de extracción
const EXTRACTION_CONFIG = {
	maxPages: 50, // Límite de páginas para evitar timeouts
	timeout: 30000, // 30 segundos timeout
	minTextLength: 10, // Mínimo texto para considerar válido
};

// Función para extraer texto de PDF usando pdfjs-dist (solo en cliente)
export async function extractTextFromPDF(file: File): Promise<string> {
	// Verificar que estamos en el cliente
	if (typeof window === 'undefined') {
		throw new Error('PDF processing solo disponible en el cliente');
	}

	return new Promise(async (resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error('Timeout procesando PDF'));
		}, EXTRACTION_CONFIG.timeout);

		try {
			// Importación dinámica solo en el cliente
			const pdfjsLib = await import('pdfjs-dist');

			// Configurar worker
			pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

			const arrayBuffer = await file.arrayBuffer();
			const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

			let fullText = '';
			const maxPages = Math.min(pdf.numPages, EXTRACTION_CONFIG.maxPages);

			// Procesar cada página
			for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
				try {
					const page = await pdf.getPage(pageNum);
					const textContent = await page.getTextContent();

					// Extraer texto de cada elemento con mejor formato
					const pageText = textContent.items
						.map((item: any) => {
							// Verificar si el item tiene texto
							if (item.str && item.str.trim()) {
								return item.str;
							}
							return '';
						})
						.filter((text) => text.length > 0)
						.join(' ');

					if (pageText.trim().length > 0) {
						fullText += `\n\n=== PÁGINA ${pageNum} ===\n${pageText}`;
					}
				} catch (pageError) {
					console.warn(`Error procesando página ${pageNum}:`, pageError);
					fullText += `\n\n=== PÁGINA ${pageNum} ===\n[Error procesando página]`;
				}
			}

			clearTimeout(timeoutId);

			if (fullText.trim().length < EXTRACTION_CONFIG.minTextLength) {
				throw new Error('No se pudo extraer texto significativo del PDF');
			}

			resolve(fullText);
		} catch (error) {
			clearTimeout(timeoutId);
			console.error('Error extracting text from PDF:', error);
			reject(new Error(`Error al procesar el archivo PDF: ${error}`));
		}
	});
}

// Función alternativa usando procesamiento básico de PDF
export async function extractTextFromPDFBasic(file: File): Promise<string> {
	try {
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		const text = new TextDecoder().decode(uint8Array);

		// Intentar extraer texto básico usando expresiones regulares
		const textMatches = text.match(/\(([^)]+)\)/g);
		if (textMatches && textMatches.length > 0) {
			const extractedText = textMatches
				.map((match) => match.replace(/[()]/g, ''))
				.filter((text) => text.trim().length > 0)
				.join(' ');

			if (extractedText.length > EXTRACTION_CONFIG.minTextLength) {
				return extractedText;
			}
		}

		// Si no se puede extraer texto, devolver placeholder
		return `[PDF: ${file.name}]\nNote: Aquest PDF podria contenir text en format d'imatge o estar protegit. Per obtenir millors resultats, converteix el PDF a un format més accessible o assegura't que el text sigui seleccionable.`;
	} catch (error) {
		console.error('Error in basic PDF processing:', error);
		return `[Error procesando PDF: ${file.name}]`;
	}
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
		console.log(
			`Procesando archivo: ${file.name}, tipo: ${file.type}, tamaño: ${file.size} bytes`,
		);

		if (file.type === 'application/pdf') {
			try {
				// Intentar procesamiento avanzado solo en cliente
				if (typeof window !== 'undefined') {
					const text = await extractTextFromPDF(file);
					console.log(`PDF procesado exitosamente: ${text.length} caracteres`);
					return cleanExtractedText(text);
				} else {
					throw new Error('PDF processing no disponible en servidor');
				}
			} catch (error) {
				console.warn('PDF avanzado falló, usando procesamiento básico:', error);
				const fallbackText = await extractTextFromPDFBasic(file);
				return cleanExtractedText(fallbackText);
			}
		} else if (file.type.includes('word') || file.name.endsWith('.docx')) {
			console.log('Procesando documento Word...');
			const text = await processWordFile(file);
			console.log(`Documento Word procesado: ${text.length} caracteres`);
			return cleanExtractedText(text);
		} else if (file.type === 'text/plain') {
			console.log('Procesando archivo de texto plano...');
			const text = await file.text();

			if (text.length < EXTRACTION_CONFIG.minTextLength) {
				throw new Error('Archivo de texto vacío');
			}

			console.log(`Texto plano procesado: ${text.length} caracteres`);
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

	// Verificar que no sea solo caracteres especiales o espacios
	const meaningfulContent = content.replace(/[\s\n\r\t]/g, '').length;
	if (meaningfulContent < EXTRACTION_CONFIG.minTextLength) {
		console.warn(`Contenido sin significado en ${filename}`);
		return false;
	}

	return true;
}

// Función para limpiar y normalizar el texto extraído
export function cleanExtractedText(text: string): string {
	return (
		text
			// Normalizar espacios en blanco
			.replace(/\s+/g, ' ')
			// Limpiar caracteres especiales problemáticos
			.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
			// Normalizar saltos de línea
			.replace(/\n\s*\n/g, '\n\n')
			// Limpiar espacios al inicio y final
			.trim()
	);
}

// Función para procesar archivos en el servidor (sin PDF avanzado)
export async function processFileServer(
	fileContent: string,
	filename: string,
): Promise<string> {
	// Esta función se usa en el servidor cuando ya tenemos el contenido
	if (
		!fileContent ||
		fileContent.trim().length < EXTRACTION_CONFIG.minTextLength
	) {
		throw new Error(`Contenido insuficiente en ${filename}`);
	}

	return cleanExtractedText(fileContent);
}

// Función para procesar múltiples archivos en el servidor
export async function processServerFiles(
	files: FileContent[],
): Promise<FileContent[]> {
	const processedFiles: FileContent[] = [];

	for (const file of files) {
		try {
			// Validar y limpiar el contenido que viene del cliente
			const cleanContent = await processFileServer(file.content, file.name);
			processedFiles.push({
				...file,
				content: cleanContent,
			});
		} catch (error) {
			console.error(`Error processing ${file.name}:`, error);
			// Continuar con el contenido original si hay error
			processedFiles.push(file);
		}
	}

	return processedFiles;
}

// Función utilitaria para obtener información del archivo
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
