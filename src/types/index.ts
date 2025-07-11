export interface FileWithContent {
	file: File;
	content: string;
	name: string;
}

export interface FileContent {
	name: string;
	content: string;
	type: 'specification' | 'proposal';
	lotNumber?: number; // For proposals, indicates which lot this file is for
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
