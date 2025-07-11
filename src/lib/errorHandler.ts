import { APP_CONFIG } from './config';

export class OptimEvaluatorError extends Error {
	public code: string;
	public isUserFriendly: boolean;

	constructor(
		message: string,
		code: string = 'GENERIC_ERROR',
		isUserFriendly: boolean = false,
	) {
		super(message);
		this.name = 'OptimEvaluatorError';
		this.code = code;
		this.isUserFriendly = isUserFriendly;
	}
}

export class FileProcessingError extends OptimEvaluatorError {
	constructor(message: string, filename?: string) {
		super(
			filename ? `${message} (${filename})` : message,
			'FILE_PROCESSING_ERROR',
			true,
		);
	}
}

export class EvaluationError extends OptimEvaluatorError {
	constructor(message: string, step?: string) {
		super(step ? `${message} en ${step}` : message, 'EVALUATION_ERROR', true);
	}
}

export class APIError extends OptimEvaluatorError {
	constructor(message: string, statusCode?: number) {
		super(
			statusCode ? `${message} (Codi: ${statusCode})` : message,
			'API_ERROR',
			true,
		);
	}
}

export class Logger {
	private static instance: Logger;
	private logs: Array<{
		timestamp: Date;
		level: 'info' | 'warn' | 'error';
		message: string;
		data?: any;
	}> = [];

	static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
		const entry = {
			timestamp: new Date(),
			level,
			message,
			data,
		};

		this.logs.push(entry);

		if (this.logs.length > 100) {
			this.logs.shift();
		}

		if (process.env.NODE_ENV === 'development') {
			console[level](
				`[${entry.timestamp.toISOString()}] ${message}`,
				data || '',
			);
		}
	}

	info(message: string, data?: any) {
		this.log('info', message, data);
	}

	warn(message: string, data?: any) {
		this.log('warn', message, data);
	}

	error(message: string, data?: any) {
		this.log('error', message, data);
	}

	getLogs() {
		return [...this.logs];
	}

	clearLogs() {
		this.logs = [];
	}
}

export function handleError(
	error: unknown,
	context?: string,
): OptimEvaluatorError {
	const logger = Logger.getInstance();

	if (error instanceof OptimEvaluatorError) {
		logger.error(`Error a ${context || 'aplicació'}:`, error.message);
		return error;
	}

	if (error instanceof Error) {
		logger.error(
			`Error no controlat a ${context || 'aplicació'}:`,
			error.message,
		);

		if (
			error.message.includes('timeout') ||
			error.message.includes('Timeout')
		) {
			return new EvaluationError(
				"L'operació ha superat el temps límit. Intenta-ho de nou.",
			);
		}

		if (
			error.message.includes('API key') ||
			error.message.includes('unauthorized')
		) {
			return new APIError(
				"Error de configuració del sistema. Contacta amb l'administrador.",
			);
		}

		if (error.message.includes('network') || error.message.includes('fetch')) {
			return new APIError(
				'Error de connexió. Verifica la teva connexió a internet.',
			);
		}

		return new OptimEvaluatorError(error.message, 'UNKNOWN_ERROR', false);
	}

	logger.error(`Error desconegut a ${context || 'aplicació'}:`, error);
	return new OptimEvaluatorError(
		'Ha ocorregut un error inesperat',
		'UNKNOWN_ERROR',
		true,
	);
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof OptimEvaluatorError && error.isUserFriendly) {
		return error.message;
	}

	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		if (message.includes('pdf')) {
			return 'Error processant el document PDF. Verifica que no estigui corrupte.';
		}

		if (message.includes('docx') || message.includes('word')) {
			return 'Error processant el document Word. Verifica que no estigui corrupte.';
		}

		if (message.includes('api') || message.includes('gemini')) {
			return "Error en el servei d'avaluació. Intenta-ho de nou.";
		}

		if (message.includes('timeout')) {
			return "L'operació ha superat el temps límit. Intenta-ho de nou.";
		}

		if (message.includes('network') || message.includes('fetch')) {
			return 'Error de connexió. Verifica la teva connexió a internet.';
		}
	}

	return 'Ha ocorregut un error inesperat. Intenta-ho de nou.';
}

export async function withRetry<T>(
	fn: () => Promise<T>,
	maxRetries: number = APP_CONFIG.evaluation.retryAttempts,
	delay: number = 1000,
): Promise<T> {
	const logger = Logger.getInstance();

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			logger.warn(`Intent ${attempt}/${maxRetries} fallit:`, error);

			if (attempt === maxRetries) {
				throw error;
			}

			await new Promise((resolve) => setTimeout(resolve, delay * attempt));
		}
	}

	throw new Error("Nombre màxim d'intents assolit");
}

export function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	errorMessage: string = "Operació cancel·lada per temps d'espera",
): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error(errorMessage));
		}, timeoutMs);

		promise
			.then(resolve)
			.catch(reject)
			.finally(() => clearTimeout(timeoutId));
	});
}

export function validateAPIResponse(response: any): void {
	if (!response) {
		throw new APIError('Resposta buida del sistema');
	}

	if (response.error) {
		throw new APIError(response.error);
	}

	if (response.criteria && !Array.isArray(response.criteria)) {
		throw new APIError(
			'Format de resposta invàlid: criteria ha de ser un array',
		);
	}

	if (response.summary && typeof response.summary !== 'string') {
		throw new APIError('Format de resposta invàlid: summary ha de ser string');
	}
}

export function useErrorHandler() {
	const logger = Logger.getInstance();

	return {
		handleError: (error: unknown, context?: string) => {
			const processedError = handleError(error, context);
			return getErrorMessage(processedError);
		},

		logInfo: (message: string, data?: any) => {
			logger.info(message, data);
		},

		logWarning: (message: string, data?: any) => {
			logger.warn(message, data);
		},

		logError: (message: string, data?: any) => {
			logger.error(message, data);
		},
	};
}
