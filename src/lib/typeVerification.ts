// src/lib/typeVerification.ts
// Este archivo verifica que todos los tipos estén correctamente definidos

import type {
	FileContent,
	EvaluationCriteria,
	EvaluationResult,
	EvaluationRequest,
	BasicInfo,
	FileWithContent,
} from '@/types';

// Verificar tipos de FileContent
const sampleFileContent: FileContent = {
	name: 'test.pdf',
	content: 'Sample content',
	type: 'specification', // Debe ser 'specification' | 'proposal'
};

// Verificar tipos de EvaluationCriteria
const sampleCriteria: EvaluationCriteria = {
	criterion: 'Test criterion',
	score: 'CUMPLE_EXITOSAMENTE', // Debe ser 'INSUFICIENTE' | 'REGULAR' | 'CUMPLE_EXITOSAMENTE'
	justification: 'Sample justification',
	strengths: ['Strength 1', 'Strength 2'],
	improvements: ['Improvement 1', 'Improvement 2'],
	references: ['Reference 1', 'Reference 2'],
};

// Verificar tipos de EvaluationResult
const sampleResult: EvaluationResult = {
	summary: 'Sample summary',
	criteria: [sampleCriteria],
	recommendation: 'Sample recommendation',
	confidence: 0.85,
	extractedCriteria: ['Criterion 1', 'Criterion 2'],
};

// Verificar tipos de EvaluationRequest
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

// Verificar tipos de BasicInfo
const sampleBasicInfo: BasicInfo = {
	title: 'Sample title',
	expedient: 'EXP-2024-001',
	entity: 'Sample entity',
	context: 'Sample context',
};

// Verificar tipos de FileWithContent
const sampleFileWithContent: FileWithContent = {
	file: new File(['content'], 'test.pdf', { type: 'application/pdf' }),
	content: 'Sample content',
	name: 'test.pdf',
};

// Función para verificar compatibilidad de tipos
export function verifyTypes(): void {
	console.log('Verificando tipos...');

	// Verificar que FileContent puede ser usado en funciones
	const testFileContent: FileContent[] = [sampleFileContent];
	console.log('FileContent[] verified:', testFileContent.length > 0);

	// Verificar que EvaluationCriteria tiene los tipos correctos
	const testScore: EvaluationCriteria['score'] = 'REGULAR';
	console.log('EvaluationCriteria score verified:', testScore === 'REGULAR');

	// Verificar que EvaluationResult es compatible
	const testResult: EvaluationResult = sampleResult;
	console.log('EvaluationResult verified:', testResult.confidence > 0);

	console.log('✅ Todos los tipos verificados correctamente');
}

// Función para verificar tipos específicos del procesamiento
export function verifyProcessingTypes(): void {
	// Verificar que el tipo de FileContent.type es restrictivo
	const validTypes: FileContent['type'][] = ['specification', 'proposal'];
	console.log('Valid FileContent types:', validTypes);

	// Verificar que el tipo de EvaluationCriteria.score es restrictivo
	const validScores: EvaluationCriteria['score'][] = [
		'INSUFICIENTE',
		'REGULAR',
		'CUMPLE_EXITOSAMENTE',
	];
	console.log('Valid EvaluationCriteria scores:', validScores);

	console.log('✅ Tipos de procesamiento verificados correctamente');
}

// Exportar para uso en desarrollo
export const typeExamples = {
	sampleFileContent,
	sampleCriteria,
	sampleResult,
	sampleRequest,
	sampleBasicInfo,
	sampleFileWithContent,
};

// Función para testing
export function runTypeTests(): boolean {
	try {
		verifyTypes();
		verifyProcessingTypes();
		return true;
	} catch (error) {
		console.error('Error en verificación de tipos:', error);
		return false;
	}
}
