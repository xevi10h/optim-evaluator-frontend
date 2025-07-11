// src/lib/apiService.ts
const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface FileContent {
	name: string;
	content: string;
	type: 'specification' | 'proposal';
}

export interface ProcessedFile {
	name: string;
	content: string;
	type: 'specification' | 'proposal';
	success: boolean;
	extractedLength?: number;
	error?: string;
}

export interface UploadResponse {
	success: boolean;
	files: ProcessedFile[];
	summary: {
		total: number;
		successful: number;
		failed: number;
	};
}

export interface EvaluationResult {
	summary: string;
	criteria: Array<{
		criterion: string;
		score: 'INSUFICIENT' | 'REGULAR' | 'COMPLEIX_EXITOSAMENT';
		justification: string;
		strengths: string[];
		improvements: string[];
		references: string[];
	}>;
	recommendation: string;
	confidence: number;
	extractedCriteria: string[];
}

class ApiService {
	private async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		const url = `${API_BASE_URL}${endpoint}`;

		const config: RequestInit = {
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			...options,
		};

		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error || `HTTP error! status: ${response.status}`,
				);
			}

			return await response.json();
		} catch (error) {
			console.error(`API Error en ${endpoint}:`, error);
			throw error;
		}
	}

	async uploadFiles(
		files: File[],
		type: 'specification' | 'proposal',
	): Promise<UploadResponse> {
		const formData = new FormData();

		files.forEach((file) => {
			formData.append('files', file);
		});

		formData.append('type', type);

		const response = await fetch(`${API_BASE_URL}/upload`, {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error || `Error uploading files: ${response.status}`,
			);
		}

		return await response.json();
	}

	async evaluateProposal(
		specifications: FileContent[],
		proposals: FileContent[],
	): Promise<EvaluationResult> {
		return this.makeRequest<EvaluationResult>('/evaluate', {
			method: 'POST',
			body: JSON.stringify({
				specifications,
				proposals,
			}),
		});
	}

	async healthCheck(): Promise<{
		status: string;
		timestamp: string;
		version: string;
	}> {
		const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
		return await response.json();
	}
}

export const apiService = new ApiService();

// Hook personalizado para usar el servicio API
import { useState } from 'react';

export function useApiService() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const executeRequest = async <T>(
		requestFn: () => Promise<T>,
	): Promise<T | null> => {
		setLoading(true);
		setError(null);

		try {
			const result = await requestFn();
			return result;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			return null;
		} finally {
			setLoading(false);
		}
	};

	const uploadFiles = (files: File[], type: 'specification' | 'proposal') =>
		executeRequest(() => apiService.uploadFiles(files, type));

	const evaluateProposal = (
		specifications: FileContent[],
		proposals: FileContent[],
	) =>
		executeRequest(() =>
			apiService.evaluateProposal(specifications, proposals),
		);

	const healthCheck = () => executeRequest(() => apiService.healthCheck());

	return {
		loading,
		error,
		uploadFiles,
		evaluateProposal,
		healthCheck,
		clearError: () => setError(null),
	};
}
