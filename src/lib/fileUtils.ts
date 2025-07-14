// src/lib/fileUtils.ts - Utilidades centralizadas para archivos

/**
 * Normaliza nombres de archivos corrigiendo problemas de codificación de caracteres
 * Específicamente diseñado para corregir problemas con caracteres catalanes y españoles
 */
export function normalizeFileName(fileName: string): string {
	try {
		let normalized = fileName;

		// Tabla de reemplazos para caracteres mal codificados
		const charReplacements: { [key: string]: string } = {
			// Caracteres con codificación UTF-8 incorrecta
			'Ã¨': 'è',
			'Ã©': 'é',
			'Ã¡': 'á',
			'Ã­': 'í',
			'Ã³': 'ó',
			Ãº: 'ú',
			'Ã¼': 'ü',
			'Ã±': 'ñ',
			'Ã§': 'ç',
			'Ã ': 'à',
			'Ã²': 'ò',
			'Ã¿': 'ÿ',
			Ãµ: 'õ',
			'Ã¦': 'æ',
			'Ã°': 'ð',
			'Ã¾': 'þ',

			// Caracteres con combinaciones especiales
			TeÌcnic: 'Tècnic',
			teÌcnic: 'tècnic',
			TeÌ: 'Tè',
			teÌ: 'tè',

			// Caracteres con símbolo euro (€) mal interpretado
			'Tè€cnic': 'Tècnic',
			'tè€cnic': 'tècnic',
			'è€': 'è',
			'é€': 'é',
			'à€': 'à',
			'ò€': 'ò',
			'ú€': 'ú',
			'í€': 'í',
			'ó€': 'ó',
			'ñ€': 'ñ',
			'ç€': 'ç',
			'ü€': 'ü',
			'á€': 'á',

			// Secuencias problemáticas adicionales
			'Ã\u008c': 'È',
			'Ã\u0081': 'Á',
			'Ã\u0089': 'É',
			'Ã\u008d': 'Í',
			'Ã\u0093': 'Ó',
			'Ã\u009a': 'Ú',

			// Caracteres especiales que pueden aparecer mal
			'â€™': "'", // Apostrofe
			'â€œ': '"', // Comillas izquierda
			'â€\u009d': '"', // Comillas derecha
			'â€"': '–', // Guión en
		};

		// Aplicar reemplazos de caracteres
		for (const [badChar, goodChar] of Object.entries(charReplacements)) {
			normalized = normalized.replace(new RegExp(badChar, 'g'), goodChar);
		}

		// Intentar decodificar URI si es necesario
		try {
			const decoded = decodeURIComponent(escape(normalized));
			if (decoded !== normalized && isValidString(decoded)) {
				normalized = decoded;
			}
		} catch (e) {
			console.warn('No se pudo decodificar URI component:', e);
		}

		// Normalizar usando NFC (Canonical Decomposition, followed by Canonical Composition)
		normalized = normalized.normalize('NFC');

		// Limpiar espacios extra y caracteres de control
		normalized = normalized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
		normalized = normalized.replace(/\s+/g, ' ').trim();

		return normalized;
	} catch (error) {
		console.warn('Error normalizing filename:', error);
		return fileName;
	}
}

/**
 * Verifica si una cadena es válida (no contiene caracteres extraños)
 */
function isValidString(str: string): boolean {
	// Verifica que no contenga caracteres de control extraños
	return !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(str);
}

/**
 * Detecta si un archivo tiene problemas de codificación
 */
export function hasEncodingIssues(fileName: string): boolean {
	const problematicPatterns = [
		/Ã[¨©¡­³º¼±§ ²¿µ¦°¾]/g, // Caracteres UTF-8 mal codificados
		/[a-zA-Z]€[a-zA-Z]/g, // Letras con símbolo euro en el medio
		/[a-zA-Z]Ì[a-zA-Z]/g, // Letras con Ì en el medio
		/â€[™œ\u009d"]/g, // Caracteres especiales mal codificados
	];

	return problematicPatterns.some((pattern) => pattern.test(fileName));
}

/**
 * Obtiene información detallada sobre un archivo
 */
export function getFileInfo(file: File) {
	const extension = file.name.split('.').pop()?.toLowerCase() || '';
	const baseName =
		file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
	const normalizedName = normalizeFileName(file.name);
	const hasIssues = hasEncodingIssues(file.name);

	return {
		originalName: file.name,
		normalizedName,
		baseName: normalizeFileName(baseName),
		extension,
		size: file.size,
		type: file.type,
		hasEncodingIssues: hasIssues,
		isSupported: ['pdf', 'doc', 'docx', 'txt'].includes(extension),
	};
}

/**
 * Valida si un archivo es soportado
 */
export function isSupportedFile(file: File): boolean {
	const supportedTypes = [
		'application/pdf',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/msword',
		'text/plain',
	];

	const supportedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
	const extension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');

	return (
		supportedTypes.includes(file.type) ||
		supportedExtensions.includes(extension)
	);
}

/**
 * Formatea el tamaño de archivo de forma legible
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Genera un ID único para un archivo basado en su contenido
 */
export function generateFileId(file: File): string {
	const normalizedName = normalizeFileName(file.name);
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);

	return `${normalizedName.replace(
		/[^a-zA-Z0-9]/g,
		'_',
	)}_${timestamp}_${random}`;
}
