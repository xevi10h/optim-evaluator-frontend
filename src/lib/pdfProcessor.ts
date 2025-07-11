// src/lib/pdfProcessor.ts (versión simplificada)
import { FileContent } from '@/types';

// Solo mantener las funciones que se usan en el servidor
export async function processServerFiles(
	files: FileContent[],
): Promise<FileContent[]> {
	const processedFiles: FileContent[] = [];

	for (const file of files) {
		try {
			const cleanContent = cleanExtractedText(file.content);

			if (cleanContent.length < 50) {
				console.warn(
					`Contenido insuficiente en ${file.name}: ${cleanContent.length} caracteres`,
				);
			}

			processedFiles.push({ ...file, content: cleanContent });
		} catch (error) {
			console.error(`Error processing ${file.name}:`, error);
			processedFiles.push(file);
		}
	}

	return processedFiles;
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

// Función para obtener información del archivo
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

// Función para validar contenido extraído
export function validateExtractedContent(
	content: string,
	filename: string,
): boolean {
	if (!content || content.trim().length < 50) {
		console.warn(
			`Contenido insuficiente en ${filename}: ${content.length} caracteres`,
		);
		return false;
	}

	// Verificar que no sea solo caracteres especiales
	const meaningfulContent = content.replace(
		/[^a-zA-Z0-9àèéíòóúÀÈÉÍÒÓÚñÑçÇ]/g,
		'',
	).length;
	if (meaningfulContent < 50) {
		console.warn(`Contenido sin significado en ${filename}`);
		return false;
	}

	return true;
}
