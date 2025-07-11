export const API_CONFIG = {
	gemini: {
		apiKey: process.env.GEMINI_API_KEY,
		model: 'gemini-2.0-flash-lite',
		temperature: 0.3,
		timeout: 120000,
	},
	files: {
		maxSize: 10 * 1024 * 1024,
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

export function validateAPIConfig(): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!API_CONFIG.gemini.apiKey) {
		errors.push('Clau del sistema no configurada');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

export function logAPICall(service: 'gemini', action: string, details?: any) {
	const timestamp = new Date().toISOString();
	console.log(
		`[${timestamp}] Crida al Sistema - ${service.toUpperCase()} - ${action}`,
		details || '',
	);
}
