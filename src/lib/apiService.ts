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
	companyName: string | null;
	companyConfidence: number;
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

// New single lot evaluation types
export interface SingleLotEvaluationRequest {
	specifications: FileContent[];
	proposals: FileContent[];
	lotInfo: LotInfo;
}

export interface SingleLotEvaluationResult {
	lotNumber: number;
	lotTitle: string;
	evaluations: LotEvaluation[];
	extractedCriteria: number;
	processingTime: number;
}

export interface EvaluationResult {
	lots: LotEvaluation[];
	extractedLots: LotInfo[];
	overallSummary: string;
	overallRecommendation: string;
	overallConfidence: number;
	completedLots?: number;
	totalLots?: number;
	isComplete?: boolean;
}

export interface ProposalComparison {
	lotNumber: number;
	lotTitle: string;
	proposalNames: string[];
	companyNames: (string | null)[];
	criteriaComparisons: Array<{
		criterion: string;
		proposals: Array<{
			proposalName: string;
			companyName: string | null;
			score: 'INSUFICIENT' | 'REGULAR' | 'COMPLEIX_EXITOSAMENT';
			arguments: string[];
			position: number;
		}>;
	}>;
	globalRanking: Array<{
		proposalName: string;
		companyName: string | null;
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

	// New method: evaluate single lot
	async evaluateSingleLot(
		specifications: FileContent[],
		proposals: FileContent[],
		lotInfo: LotInfo,
	): Promise<SingleLotEvaluationResult> {
		console.log(
			`Starting evaluation for lot ${lotInfo.lotNumber}: ${lotInfo.title}`,
		);

		return this.makeRequest<SingleLotEvaluationResult>('/evaluate-lot', {
			method: 'POST',
			body: JSON.stringify({
				specifications,
				proposals,
				lotInfo,
			}),
		});
	}

	// Updated method: evaluate all lots (calls single lot evaluation for each)
	async evaluateAllLots(
		specifications: FileContent[],
		proposals: FileContent[],
		lots: LotInfo[],
		onProgress?: (progress: {
			currentLot: number;
			totalLots: number;
			currentLotTitle: string;
		}) => void,
	): Promise<EvaluationResult> {
		console.log('Starting evaluation for all lots...');

		const allEvaluations: LotEvaluation[] = [];
		const totalLots = lots.length;

		for (let i = 0; i < lots.length; i++) {
			const lot = lots[i];

			// Report progress
			if (onProgress) {
				onProgress({
					currentLot: i + 1,
					totalLots,
					currentLotTitle: lot.title,
				});
			}

			// Get proposals for this specific lot
			const lotProposals = proposals.filter(
				(p) => p.lotNumber === lot.lotNumber,
			);

			// Evaluate this lot
			const lotResult = await this.evaluateSingleLot(
				specifications,
				lotProposals,
				lot,
			);

			// Add evaluations to the collection
			allEvaluations.push(...lotResult.evaluations);
		}

		// Build final result
		const result: EvaluationResult = {
			lots: allEvaluations,
			extractedLots: lots,
			overallSummary: this.generateOverallSummary(allEvaluations, lots),
			overallRecommendation: this.generateOverallRecommendation(
				allEvaluations,
				lots,
			),
			overallConfidence:
				allEvaluations.length > 0
					? allEvaluations.reduce((sum, lot) => sum + lot.confidence, 0) /
					  allEvaluations.length
					: 0,
			completedLots: lots.length,
			totalLots: lots.length,
			isComplete: true,
		};

		return result;
	}

	private generateOverallSummary(
		evaluations: LotEvaluation[],
		lots: LotInfo[],
	): string {
		const totalProposals = evaluations.filter((e) => e.hasProposal).length;
		const companiesIdentified = evaluations.filter(
			(e) => e.companyName !== null,
		).length;

		return (
			`S'han avaluat ${totalProposals} propostes distribuïdes en ${lots.length} lots. ` +
			`S'han identificat automàticament ${companiesIdentified} empreses de ${totalProposals} propostes presentades. ` +
			`L'avaluació ha estat completada amb èxit utilitzant criteris específics per cada lot.`
		);
	}

	private generateOverallRecommendation(
		evaluations: LotEvaluation[],
		lots: LotInfo[],
	): string {
		const hasMultipleLots = lots.length > 1;

		if (hasMultipleLots) {
			return (
				`Es recomana revisar individualment cada lot i les seves respectives avaluacions. ` +
				`Cada lot ha estat avaluat segons els seus criteris específics i requereix una anàlisi detallada ` +
				`per prendre decisions informades sobre l'adjudicació.`
			);
		} else {
			return (
				`Es recomana revisar detingudament l'avaluació realitzada per prendre una decisió ` +
				`informada sobre l'adjudicació d'aquest lot únic.`
			);
		}
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
		});

		const requestBody = {
			specifications,
			lotInfo,
			evaluatedProposals,
		};

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

	const evaluateSingleLot = (
		specifications: FileContent[],
		proposals: FileContent[],
		lotInfo: LotInfo,
	) =>
		executeRequest(() =>
			apiService.evaluateSingleLot(specifications, proposals, lotInfo),
		);

	const evaluateAllLots = (
		specifications: FileContent[],
		proposals: FileContent[],
		lots: LotInfo[],
		onProgress?: (progress: {
			currentLot: number;
			totalLots: number;
			currentLotTitle: string;
		}) => void,
	) =>
		executeRequest(() =>
			apiService.evaluateAllLots(specifications, proposals, lots, onProgress),
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
		evaluateSingleLot,
		evaluateAllLots,
		compareProposals,
		healthCheck,
		clearError: () => setError(null),
	};
}
