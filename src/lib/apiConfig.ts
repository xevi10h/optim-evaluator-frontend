// src/lib/apiConfig.ts
export const API_CONFIG = {
	// PDFRest API Configuration
	pdfrest: {
		apiKey:
			process.env.PDFREST_API_KEY || '0d040095-68ab-41e7-a0f8-3c9dca8b2756',
		baseUrl: 'https://api.pdfrest.com',
		endpoints: {
			extractText: '/extracted-text',
		},
		timeout: 30000, // 30 segundos
		maxRetries: 3,
	},

	// Google Gemini API Configuration
	gemini: {
		apiKey: process.env.GEMINI_API_KEY,
		model: 'gemini-2.0-flash-lite',
		temperature: 0.3,
		timeout: 120000, // 2 minutos
	},

	// File processing limits
	files: {
		maxSize: 10 * 1024 * 1024, // 10MB
		supportedTypes: [
			'application/pdf',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/msword',
			'text/plain',
		],
		pdf: {
			maxPages: 100,
			minExtractedLength: 50,
		},
	},
};

// Función para validar configuración
export function validateAPIConfig(): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!API_CONFIG.pdfrest.apiKey) {
		errors.push('PDFRest API key no configurada');
	}

	if (!API_CONFIG.gemini.apiKey) {
		errors.push('Gemini API key no configurada');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

// Función para obtener headers de PDFRest
export function getPDFRestHeaders(formDataHeaders: Record<string, string>) {
	return {
		'Api-Key': API_CONFIG.pdfrest.apiKey,
		...formDataHeaders,
	};
}

// Función para logging de API calls
export function logAPICall(
	service: 'pdfrest' | 'gemini',
	action: string,
	details?: any,
) {
	const timestamp = new Date().toISOString();
	console.log(
		`[${timestamp}] API Call - ${service.toUpperCase()} - ${action}`,
		details || '',
	);
}
