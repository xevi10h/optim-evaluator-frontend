import type {
	FileContent,
	EvaluationCriteria,
	EvaluationResult,
	EvaluationRequest,
	BasicInfo,
	FileWithContent,
} from '@/types';

const sampleFileContent: FileContent = {
	name: 'test.pdf',
	content: 'Sample content',
	type: 'specification',
};

const sampleCriteria: EvaluationCriteria = {
	criterion: 'Test criterion',
	score: 'COMPLEIX_EXITOSAMENT',
	justification: 'Sample justification',
	strengths: ['Strength 1', 'Strength 2'],
	improvements: ['Improvement 1', 'Improvement 2'],
	references: ['Reference 1', 'Reference 2'],
};

const sampleResult: EvaluationResult = {
	summary: 'Sample summary',
	criteria: [sampleCriteria],
	recommendation: 'Sample recommendation',
	confidence: 0.85,
	extractedCriteria: ['Criterion 1', 'Criterion 2'],
};

const sampleRequest: EvaluationRequest = {
	specifications: [sampleFileContent],
	proposals: [
		{
			name: 'proposal.pdf',
			content: 'Proposal content',
			type: 'proposal',
		},
	],
};

const sampleBasicInfo: BasicInfo = {
	title: 'Sample title',
	expedient: 'EXP-2024-001',
	entity: 'Sample entity',
	context: 'Sample context',
};

const sampleFileWithContent: FileWithContent = {
	file: new File(['content'], 'test.pdf', { type: 'application/pdf' }),
	content: 'Sample content',
	name: 'test.pdf',
};

export function verifyTypes(): void {
	console.log('Verificant tipus...');

	const testFileContent: FileContent[] = [sampleFileContent];
	console.log('FileContent[] verificat:', testFileContent.length > 0);

	const testScore: EvaluationCriteria['score'] = 'REGULAR';
	console.log(
		"Puntuació d'EvaluationCriteria verificada:",
		testScore === 'REGULAR',
	);

	const testResult: EvaluationResult = sampleResult;
	console.log('EvaluationResult verificat:', testResult.confidence > 0);

	console.log('✅ Tots els tipus verificats correctament');
}

export function verifyProcessingTypes(): void {
	const validTypes: FileContent['type'][] = ['specification', 'proposal'];
	console.log('Tipus de FileContent vàlids:', validTypes);

	const validScores: EvaluationCriteria['score'][] = [
		'INSUFICIENT',
		'REGULAR',
		'COMPLEIX_EXITOSAMENT',
	];
	console.log("Puntuacions d'EvaluationCriteria vàlides:", validScores);

	console.log('✅ Tipus de processament verificats correctament');
}

export const typeExamples = {
	sampleFileContent,
	sampleCriteria,
	sampleResult,
	sampleRequest,
	sampleBasicInfo,
	sampleFileWithContent,
};

export function runTypeTests(): boolean {
	try {
		verifyTypes();
		verifyProcessingTypes();
		return true;
	} catch (error) {
		console.error('Error en verificació de tipus:', error);
		return false;
	}
}
