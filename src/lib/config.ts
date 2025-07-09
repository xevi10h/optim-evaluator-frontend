// src/lib/config.ts
export const APP_CONFIG = {
	// Configuración de archivos
	files: {
		maxSize: 10 * 1024 * 1024, // 10MB
		allowedTypes: [
			'application/pdf',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/msword',
			'text/plain',
		],
		allowedExtensions: ['.pdf', '.docx', '.doc', '.txt'],
	},

	// Configuración de evaluación
	evaluation: {
		maxCriteria: 8,
		minCriteriaDescriptionLength: 15,
		maxCriteriaDescriptionLength: 100,
		timeout: 120000, // 2 minutos
		retryAttempts: 3,
	},

	// Configuración de IA
	ai: {
		model: 'gemini-pro',
		temperature: 0.3, // Más determinista para evaluaciones
		maxTokens: 4000,
		topK: 40,
		topP: 0.95,
	},

	// Configuración de PDF
	pdf: {
		maxPages: 50,
		timeout: 30000,
		minTextLength: 10,
	},

	// Mensajes de la aplicación
	messages: {
		errors: {
			fileTooBig: "L'arxiu supera el límit de 10MB",
			fileTypeNotSupported: "Tipus d'arxiu no suportat",
			processingError: "Error processant l'arxiu",
			evaluationError: "Error durant l'avaluació",
			missingApiKey: 'Clau API de Google Gemini no configurada',
			missingFiles: 'Si us plau, puja els arxius necessaris',
			missingInfo: 'Si us plau, completa la informació bàsica',
		},
		success: {
			fileProcessed: 'Arxiu processat correctament',
			evaluationComplete: 'Avaluació completada',
			pdfGenerated: 'PDF generat correctament',
		},
		loading: {
			processingFile: 'Processant arxiu...',
			extractingCriteria: "Extraient criteris d'avaluació...",
			evaluatingCriteria: 'Avaluant criteris...',
			generatingSummary: 'Generant resum executiu...',
			connectingAI: 'Connectant amb la intel·ligència artificial...',
		},
	},
};

// Función para validar configuración
export function validateConfig(): boolean {
	if (!process.env.GOOGLE_GEMINI_API_KEY) {
		console.error('GOOGLE_GEMINI_API_KEY no está configurada');
		return false;
	}

	return true;
}

// Función para validar archivos
export function validateFile(file: File): { isValid: boolean; error?: string } {
	if (file.size > APP_CONFIG.files.maxSize) {
		return {
			isValid: false,
			error: `${APP_CONFIG.messages.errors.fileTooBig}: ${file.name}`,
		};
	}

	const isValidType =
		APP_CONFIG.files.allowedTypes.includes(file.type) ||
		APP_CONFIG.files.allowedExtensions.some((ext) =>
			file.name.toLowerCase().endsWith(ext),
		);

	if (!isValidType) {
		return {
			isValid: false,
			error: `${APP_CONFIG.messages.errors.fileTypeNotSupported}: ${file.name}`,
		};
	}

	return { isValid: true };
}

// Función para formatear tamaño de archivo
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función para obtener icono según tipo de archivo
export function getFileIcon(filename: string): string {
	const ext = filename.toLowerCase().split('.').pop();

	switch (ext) {
		case 'pdf':
			return '📄';
		case 'docx':
		case 'doc':
			return '📝';
		case 'txt':
			return '📄';
		default:
			return '📄';
	}
}

// Constantes para la UI
export const UI_CONFIG = {
	colors: {
		primary: '#199875',
		primaryDark: '#188869',
		secondary: '#dfe7e6',
		textDark: '#1c1c1c',
		textMedium: '#949494',
		textLight: '#6f6f6f',
		success: '#059669',
		warning: '#f59e0b',
		error: '#dc2626',
	},

	gradients: {
		primary: 'linear-gradient(135deg, #199875 0%, #188869 100%)',
		background: 'linear-gradient(135deg, #dfe7e6 0%, #ffffff 100%)',
	},

	animation: {
		duration: 300,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
	},
};
