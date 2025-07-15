export interface FileWithContent {
	file: File;
	content: string;
	name: string;
}

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

export interface EvaluationCriteria {
	criterion: string;
	score: 'INSUFICIENT' | 'REGULAR' | 'COMPLEIX_EXITOSAMENT';
	justification: string;
	strengths: string[];
	improvements: string[];
	references: string[];
}

export interface LotEvaluation {
	lotNumber: number;
	lotTitle: string;
	proposalName: string;
	companyName: string | null; // Nom de l'empresa o null si no s'ha pogut identificar
	companyConfidence: number; // Confiança de la identificació d'empresa (0-1)
	hasProposal: boolean;
	criteria: EvaluationCriteria[];
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

export interface CriterionComparison {
	criterion: string;
	proposals: Array<{
		proposalName: string;
		companyName: string | null; // Nom de l'empresa o null
		score: 'INSUFICIENT' | 'REGULAR' | 'COMPLEIX_EXITOSAMENT';
		arguments: string[];
		position: number;
	}>;
}

export interface ComparisonRanking {
	proposalName: string;
	companyName: string | null; // Nom de l'empresa o null
	position: number;
	overallScore: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
	strengths: string[];
	weaknesses: string[];
	recommendation: string;
}

export interface ProposalComparison {
	lotNumber: number;
	lotTitle: string;
	proposalNames: string[];
	companyNames: (string | null)[]; // Array de noms d'empresa o null
	criteriaComparisons: CriterionComparison[];
	globalRanking: ComparisonRanking[];
	summary: string;
	confidence: number;
}

export interface ComparisonResult {
	comparison: ProposalComparison;
	timestamp: string;
}

export interface ProcessingState {
	isProcessing: boolean;
	currentFile: string | null;
	error: string | null;
	progress: number;
}

export interface BasicInfo {
	title: string;
	expedient: string;
	entity: string;
	context: string;
}

export interface ProposalFile extends FileWithContent {
	lotNumber: number;
}

export interface APIResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	details?: string;
}

export interface FileInfo {
	name: string;
	type: string;
	size: number;
	extension: string;
	isSupported: boolean;
}

export interface EvaluationRequest {
	specifications: FileContent[];
	proposals: FileContent[];
	lots: LotInfo[];
}

export interface LotExtractionRequest {
	specifications: FileContent[];
}

export interface ComparisonRequest {
	specifications: FileContent[];
	lotInfo: LotInfo;
	evaluatedProposals: LotEvaluation[];
}

export interface PDFProcessingOptions {
	maxPages?: number;
	timeout?: number;
	minTextLength?: number;
}

export interface ProcessingError {
	code: string;
	message: string;
	isUserFriendly: boolean;
	filename?: string;
	step?: string;
}

export const SUPPORTED_FILE_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/msword',
	'text/plain',
] as const;

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'] as const;

export const EVALUATION_SCORES = {
	INSUFICIENT: 'INSUFICIENT',
	REGULAR: 'REGULAR',
	COMPLEIX_EXITOSAMENT: 'COMPLEIX_EXITOSAMENT',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_CRITERIA = 8;
export const MIN_JUSTIFICATION_LENGTH = 100;

export type EvaluationScore = keyof typeof EVALUATION_SCORES;
export type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

// FUNCIONS SIMPLIFICADES PER GESTIÓ D'EMPRESES

/**
 * Retorna el nom a mostrar: nom d'empresa si està disponible, sinó nom del document amb indicació
 */
export function getDisplayName(
	companyName: string | null,
	proposalName: string,
): string {
	if (companyName && companyName.trim().length > 0) {
		return companyName;
	}
	return `${proposalName} (empresa no identificada)`;
}

/**
 * Retorna un nom curt per mostrar en espais reduïts
 */
export function getShortDisplayName(
	companyName: string | null,
	proposalName: string,
): string {
	if (companyName && companyName.trim().length > 0) {
		return companyName.length > 30
			? `${companyName.substring(0, 27)}...`
			: companyName;
	}

	const shortName =
		proposalName.length > 20
			? `${proposalName.substring(0, 17)}...`
			: proposalName;
	return `${shortName} (no identificada)`;
}

/**
 * Comprova si tenim informació d'empresa identificada
 */
export function hasCompanyInfo(evaluation: LotEvaluation): boolean {
	return (
		evaluation.companyName !== null && evaluation.companyName.trim().length > 0
	);
}

/**
 * Converteix la confiança numèrica en text descriptiu
 */
export function getCompanyConfidenceText(confidence: number): string {
	if (confidence >= 0.8) return 'Alta confiança';
	if (confidence >= 0.6) return 'Confiança mitjana';
	if (confidence >= 0.4) return 'Baixa confiança';
	if (confidence > 0) return 'Molt baixa confiança';
	return 'No identificada';
}

/**
 * Retorna el nom de l'empresa o un text per defecte
 */
export function getCompanyNameOrDefault(
	companyName: string | null,
	defaultText: string = 'Empresa no especificada',
): string {
	return companyName && companyName.trim().length > 0
		? companyName
		: defaultText;
}
