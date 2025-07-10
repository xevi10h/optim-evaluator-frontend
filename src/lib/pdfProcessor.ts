// src/lib/pdfProcessor.ts
import { FileContent } from '@/types';
import * as pdfjsLib from 'pdfjs-dist';
// Add TextItem to the import
import type {
	PDFDocumentProxy,
	TextContent,
	TextItem,
} from 'pdfjs-dist/types/src/display/api';

const EXTRACTION_CONFIG = {
	maxPages: 50,
	timeout: 30000,
	minTextLength: 10,
};

// Función principal simplificada para procesar archivos
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
			const text = await extractTextWithPDFJS(file);
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

export async function extractTextWithPDFJS(file: File): Promise<string> {
	if (typeof window === 'undefined') {
		throw new Error(
			'El procesamiento de PDF solo está disponible en el cliente',
		);
	}

	try {
		pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

		const arrayBuffer = await file.arrayBuffer();
		const loadingTask = pdfjsLib.getDocument({
			data: arrayBuffer,
			verbosity: 0,
		});

		const pdf: PDFDocumentProxy = await loadingTask.promise;
		let fullText = '';
		const maxPages = Math.min(pdf.numPages, 50); // Using a constant for clarity

		for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
			try {
				const page = await pdf.getPage(pageNum);
				const textContent: TextContent = await page.getTextContent();

				// CORRECTED LINE:
				// This type predicate now correctly tells TypeScript that any item
				// that passes the filter is of the type 'TextItem'.
				const pageText = textContent.items
					.filter((item): item is TextItem => 'str' in item)
					.map((item: TextItem) => item.str)
					.join(' ');

				if (pageText.trim()) {
					fullText += pageText + '\n\n';
				}
				page.cleanup();
			} catch (pageError) {
				console.warn(
					`Error procesando la página ${pageNum} del PDF:`,
					pageError,
				);
			}
		}

		if (fullText.trim().length < 10) {
			// Using a constant for clarity
			throw new Error(
				'No se pudo extraer suficiente texto del PDF. Puede que el documento solo contenga imágenes.',
			);
		}

		return fullText;
	} catch (error) {
		console.error('Error final durante la extracción con PDF.js:', error);
		throw error;
	}
}

// Método 1: PDF-lib (más simple y confiable)
async function extractWithPDFLib(file: File): Promise<string> {
	try {
		const { PDFDocument } = await import('pdf-lib');

		const arrayBuffer = await file.arrayBuffer();
		const pdfDoc = await PDFDocument.load(arrayBuffer);

		const pages = pdfDoc.getPages();
		let fullText = '';

		for (
			let i = 0;
			i < Math.min(pages.length, EXTRACTION_CONFIG.maxPages);
			i++
		) {
			const page = pages[i];

			// PDF-lib no tiene extracción de texto directa, pero podemos intentar
			// extraer del contenido de la página
			try {
				// Intentar obtener contenido de texto de la página
				const content = page.node.Contents();
				if (content) {
					fullText += `\n\n=== PÀGINA ${i + 1} ===\n`;
					// Aquí necesitaríamos un parser más sofisticado
					// Por ahora, usaremos este método como fallback
				}
			} catch (pageError) {
				console.warn(`Error procesando página ${i + 1}:`, pageError);
			}
		}

		if (fullText.trim().length < EXTRACTION_CONFIG.minTextLength) {
			throw new Error('No se pudo extraer texto con PDF-lib');
		}

		return fullText;
	} catch (error) {
		console.error('Error con PDF-lib:', error);
		throw error;
	}
}

// Método 2: PDF.js simplificado (sin worker externo)
async function extractWithSimplePDFJS(file: File): Promise<string> {
	try {
		// Intentar importación dinámica más segura
		const pdfjsLib = await import('pdfjs-dist');

		// Configurar worker de manera más segura
		if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
			// Usar worker inline simple
			const workerBlob = new Blob(
				[
					`
				self.onmessage = function(e) {
					try {
						// Worker mínimo para PDF.js
						importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js');
					} catch (err) {
						console.warn('Worker PDF.js no disponible');
					}
				};
			`,
				],
				{ type: 'application/javascript' },
			);

			pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
		}

		const arrayBuffer = await file.arrayBuffer();
		const loadingTask = pdfjsLib.getDocument({
			data: arrayBuffer,
			verbosity: 0,
			disableStream: true,
			disableAutoFetch: true,
		});

		const pdf = await loadingTask.promise;
		let fullText = '';
		const maxPages = Math.min(pdf.numPages, EXTRACTION_CONFIG.maxPages);

		for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
			try {
				const page = await pdf.getPage(pageNum);
				const textContent = await page.getTextContent();

				const pageText = textContent.items
					.filter((item: any) => item.str)
					.map((item: any) => item.str)
					.join(' ');

				if (pageText.trim()) {
					fullText += `\n\n=== PÀGINA ${pageNum} ===\n${pageText}`;
				}
			} catch (pageError) {
				console.warn(`Error procesando página ${pageNum}:`, pageError);
			}
		}

		if (fullText.trim().length < EXTRACTION_CONFIG.minTextLength) {
			throw new Error('No se pudo extraer suficiente texto');
		}

		return fullText;
	} catch (error) {
		console.error('Error con PDF.js simplificado:', error);
		throw error;
	}
}

// Método 3: Extracción manual básica
async function extractWithManualParsing(file: File): Promise<string> {
	try {
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		// Buscar patrones de texto en el PDF
		let text = '';
		let currentString = '';
		let inTextObject = false;

		for (let i = 0; i < uint8Array.length - 10; i++) {
			const char = uint8Array[i];

			// Buscar marcadores de inicio de texto
			if (char === 0x42 && uint8Array[i + 1] === 0x54) {
				// "BT"
				inTextObject = true;
				continue;
			}

			// Buscar marcadores de fin de texto
			if (char === 0x45 && uint8Array[i + 1] === 0x54) {
				// "ET"
				inTextObject = false;
				if (currentString.trim()) {
					text += currentString + ' ';
					currentString = '';
				}
				continue;
			}

			// Si estamos en un objeto de texto y el carácter es imprimible
			if (inTextObject && char >= 32 && char <= 126) {
				currentString += String.fromCharCode(char);
			} else if (inTextObject && (char === 10 || char === 13)) {
				if (currentString.trim()) {
					text += currentString + '\n';
					currentString = '';
				}
			} else if (currentString.length > 0) {
				if (currentString.trim()) {
					text += currentString + ' ';
				}
				currentString = '';
			}
		}

		// Limpiar el texto extraído
		text = text
			.replace(/[^\x20-\x7E\n\r\tàèéíòóúÀÈÉÍÒÓÚñÑçÇüÜ]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		if (text.length < EXTRACTION_CONFIG.minTextLength) {
			throw new Error('Extracción manual insuficiente');
		}

		return `=== CONTENIDO EXTRAÍDO MANUALMENTE ===\n\n${text}`;
	} catch (error) {
		console.error('Error en extracción manual:', error);
		throw error;
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

// Placeholder informativo mejorado
function generatePDFPlaceholder(file: File): string {
	return `[PDF: ${file.name}]

⚠️ IMPORTANTE: Este PDF no se pudo procesar automáticamente.

INFORMACIÓN DEL ARCHIVO:
- Nombre: ${file.name}
- Tamaño: ${formatFileSize(file.size)}
- Tipo: ${file.type}

POSIBLES CAUSAS:
• El PDF contiene texto en formato de imagen (escaneado)
• El PDF está protegido, cifrado o corrupto
• El PDF utiliza codificación especial o fonts no estándar
• Error temporal en el sistema de procesamiento

RECOMENDACIONES:
1. 📋 Copia manualmente el texto relevante del PDF y pégalo en un archivo .txt
2. 📄 Convierte el PDF a formato Word (.docx) si es posible
3. 🔍 Verifica que el texto del PDF se puede seleccionar manualmente
4. 🔄 Intenta con otro PDF del mismo contenido

INSTRUCCIONES PARA CONTINUAR:
- El sistema puede continuar la evaluación con los otros documentos disponibles
- Para mejores resultados, incluye el contenido de este PDF en formato texto
- Puedes mencionar manualmente los criterios importantes en el campo "Context Adicional"

CONTENIDO SUGERIDO PARA INCLUIR:
- Criterios de evaluación específicos
- Requisitos técnicos principales  
- Puntuación o metodología de evaluación
- Cualquier información relevante para la evaluación de propuestas`;
}

// Función para limpiar texto extraído
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
