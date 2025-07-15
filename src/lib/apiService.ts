const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface FileContent {
	name: string;
	content: string;
	type: 'specification' | 'proposal';
	lotNumber?: number;
}

export interface LotInfo {
	lotNumber: number;
	title: string;
	description?: string;
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

export interface LotEvaluation {
	lotNumber: number;
	lotTitle: string;
	proposalName: string;
	hasProposal: boolean;
	criteria: Array<{
		criterion: string;
		score: 'INSUFICIENT' | 'REGULAR' | 'COMPLEIX_EXITOSAMENT';
		justification: string;
		strengths: string[];
		improvements: string[];
		references: string[];
	}>;
	summary: string;
	recommendation: string;
	confidence: number;
}

export interface EvaluationResult {
	lots: LotEvaluation[];
	extractedLots: LotInfo[];
	overallSummary: string;
	overallRecommendation: string;
	overallConfidence: number;
}

export interface ProposalComparison {
	lotNumber: number;
	lotTitle: string;
	proposalNames: string[];
	criteriaComparisons: Array<{
		criterion: string;
		proposals: Array<{
			proposalName: string;
			score: 'INSUFICIENT' | 'REGULAR' | 'COMPLEIX_EXITOSAMENT';
			arguments: string[];
			position: number;
		}>;
	}>;
	globalRanking: Array<{
		proposalName: string;
		position: number;
		overallScore: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
		strengths: string[];
		weaknesses: string[];
		recommendation: string;
	}>;
	summary: string;
	confidence: number;
}

export interface ComparisonResult {
	comparison: ProposalComparison;
	timestamp: string;
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

	async extractLots(specifications: FileContent[]): Promise<LotInfo[]> {
		return this.makeRequest<LotInfo[]>('/extract-lots', {
			method: 'POST',
			body: JSON.stringify({ specifications }),
		});
	}

	async evaluateProposalWithLots(
		specifications: FileContent[],
		proposals: FileContent[],
		lots: LotInfo[],
	): Promise<EvaluationResult> {
		console.log('Starting evaluation...');

		return this.makeRequest<EvaluationResult>('/evaluate-lots', {
			method: 'POST',
			body: JSON.stringify({
				specifications,
				proposals,
				lots,
			}),
		});
	}

	async compareProposals(
		specifications: FileContent[],
		lotInfo: LotInfo,
		evaluatedProposals: LotEvaluation[],
	): Promise<ComparisonResult> {
		console.log('API Service - compareProposals called with:', {
			specificationsCount: specifications.length,
			lotInfo,
			evaluatedProposalsCount: evaluatedProposals.length,
			evaluatedProposals: evaluatedProposals.map((p) => ({
				name: p.proposalName,
				lotNumber: p.lotNumber,
				hasProposal: p.hasProposal,
				criteriaCount: p.criteria.length,
			})),
		});

		const requestBody = {
			specifications,
			lotInfo,
			evaluatedProposals,
		};

		console.log('Request body structure:', {
			hasSpecifications: Array.isArray(requestBody.specifications),
			hasLotInfo: !!requestBody.lotInfo,
			hasEvaluatedProposals: Array.isArray(requestBody.evaluatedProposals),
		});

		return this.makeRequest<ComparisonResult>('/compare-proposals', {
			method: 'POST',
			body: JSON.stringify(requestBody),
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

	const extractLots = (specifications: FileContent[]) =>
		executeRequest(() => apiService.extractLots(specifications));

	const evaluateProposalWithLots = (
		specifications: FileContent[],
		proposals: FileContent[],
		lots: LotInfo[],
	) =>
		executeRequest(() =>
			apiService.evaluateProposalWithLots(specifications, proposals, lots),
		);

	const compareProposals = (
		specifications: FileContent[],
		lotInfo: LotInfo,
		evaluatedProposals: LotEvaluation[],
	) =>
		executeRequest(() =>
			apiService.compareProposals(specifications, lotInfo, evaluatedProposals),
		);

	const healthCheck = () => executeRequest(() => apiService.healthCheck());

	return {
		loading,
		error,
		uploadFiles,
		extractLots,
		evaluateProposalWithLots,
		compareProposals,
		healthCheck,
		clearError: () => setError(null),
	};
}
