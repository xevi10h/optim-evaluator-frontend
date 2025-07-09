// src/app/api/evaluate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { processServerFiles } from '@/lib/pdfProcessor';
import type {
	EvaluationCriteria,
	EvaluationResult,
	FileContent,
	EvaluationRequest,
} from '@/types';

// Configuración de Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Función para extraer criterios evaluables de las especificaciones
async function extractEvaluationCriteria(
	specifications: FileContent[],
): Promise<string[]> {
	const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

	const specsContent = specifications
		.map(
			(spec) => `
    === DOCUMENT: ${spec.name} ===
    ${spec.content}
  `,
		)
		.join('\n\n');

	const prompt = `
    Analiza los siguientes documentos de especificaciones de licitación y extrae ÚNICAMENTE los criterios SUBJETIVOS que requieren evaluación cualitativa.

    DOCUMENTOS DE ESPECIFICACIONES:
    ${specsContent}

    INSTRUCCIONES:
    1. Identifica solo criterios que requieren evaluación subjetiva/cualitativa
    2. Excluye requisitos técnicos objetivos (como "debe tener certificación X")
    3. Incluye aspectos como: experiencia, metodología, calidad, innovación, organización, etc.
    4. Cada criterio debe ser evaluable en términos de calidad/adecuación
    5. Máximo 8 criterios para mantener la evaluación manejable

    FORMATO DE RESPUESTA:
    Responde SOLO con una lista JSON de strings, sin explicaciones adicionales:
    ["Criterio 1", "Criterio 2", "Criterio 3", ...]

    EJEMPLO:
    ["Experiencia y capacidad técnica del equipo", "Metodología y planificación del proyecto", "Calidad de la propuesta técnica", "Innovación y valor añadido"]
  `;

	try {
		const result = await model.generateContent(prompt);
		const response = result.response.text();

		// Intentar parsear la respuesta JSON
		try {
			const criteria = JSON.parse(response);
			return Array.isArray(criteria) ? criteria : [];
		} catch (parseError) {
			console.error('Error parsing criteria JSON:', parseError);
			// Fallback: extraer criterios del texto si no es JSON válido
			return extractCriteriaFromText(response);
		}
	} catch (error) {
		console.error('Error extracting criteria:', error);
		return [];
	}
}

// Función de fallback para extraer criterios del texto
function extractCriteriaFromText(text: string): string[] {
	const lines = text.split('\n');
	const criteria: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.length > 10 && trimmed.length < 100) {
			// Limpiar formato de lista
			const cleaned = trimmed
				.replace(/^[\d\-\*\•\.\)]+\s*/, '')
				.replace(/["\[\]]/g, '');
			if (cleaned.length > 5) {
				criteria.push(cleaned);
			}
		}
	}

	return criteria.slice(0, 8); // Máximo 8 criterios
}

// Función para evaluar cada criterio
async function evaluateCriterion(
	criterion: string,
	specifications: FileContent[],
	proposals: FileContent[],
): Promise<EvaluationCriteria> {
	const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

	const specsContent = specifications
		.map(
			(spec) => `
    === ESPECIFICACIÓN: ${spec.name} ===
    ${spec.content}
  `,
		)
		.join('\n\n');

	const proposalContent = proposals
		.map(
			(proposal) => `
    === PROPUESTA: ${proposal.name} ===
    ${proposal.content}
  `,
		)
		.join('\n\n');

	const prompt = `
    Evalúa el siguiente criterio basándote en las especificaciones de la licitación y la propuesta presentada.

    CRITERIO A EVALUAR: ${criterion}

    ESPECIFICACIONES DE LA LICITACIÓN:
    ${specsContent}

    PROPUESTA A EVALUAR:
    ${proposalContent}

    INSTRUCCIONES PARA LA EVALUACIÓN:
    1. Analiza qué se requiere según las especificaciones para este criterio
    2. Evalúa cómo cumple la propuesta con estos requisitos
    3. Asigna una de estas calificaciones:
       - INSUFICIENTE: No cumple requisitos mínimos
       - REGULAR: Cumple parcialmente los requisitos
       - CUMPLE_EXITOSAMENTE: Supera las expectativas
    
    4. Proporciona una justificación detallada (mínimo 100 palabras)
    5. Identifica 2-4 puntos fuertes específicos
    6. Identifica 2-4 áreas de mejora específicas
    7. Referencia secciones específicas de las especificaciones

    FORMATO DE RESPUESTA (JSON):
    {
      "score": "INSUFICIENTE|REGULAR|CUMPLE_EXITOSAMENTE",
      "justification": "Justificación detallada de al menos 100 palabras...",
      "strengths": ["Punto fuerte 1", "Punto fuerte 2", "Punto fuerte 3"],
      "improvements": ["Mejora 1", "Mejora 2", "Mejora 3"],
      "references": ["Referencia 1", "Referencia 2"]
    }

    Responde SOLO con el JSON, sin texto adicional.
  `;

	try {
		const result = await model.generateContent(prompt);
		const response = result.response.text();

		// Limpiar la respuesta para extraer solo el JSON
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const evaluation = JSON.parse(jsonMatch[0]);

			return {
				criterion,
				score: evaluation.score,
				justification: evaluation.justification,
				strengths: evaluation.strengths || [],
				improvements: evaluation.improvements || [],
				references: evaluation.references || [],
			};
		} else {
			throw new Error('No se pudo extraer JSON de la respuesta');
		}
	} catch (error) {
		console.error(`Error evaluating criterion "${criterion}":`, error);

		// Respuesta de fallback
		return {
			criterion,
			score: 'REGULAR',
			justification: `No se pudo evaluar automáticamente el criterio "${criterion}". Se requiere revisión manual.`,
			strengths: ['Revisión manual requerida'],
			improvements: ['Evaluación automática fallida'],
			references: ['Error en procesamiento'],
		};
	}
}

// Función para generar resumen ejecutivo y recomendación
async function generateExecutiveSummary(
	criteria: EvaluationCriteria[],
	specifications: FileContent[],
	proposals: FileContent[],
): Promise<{ summary: string; recommendation: string; confidence: number }> {
	const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

	const criteriaResults = criteria
		.map(
			(c) => `
    - ${c.criterion}: ${c.score}
    ${c.justification}
  `,
		)
		.join('\n');

	const prompt = `
    Basándote en los siguientes resultados de evaluación, genera un resumen ejecutivo y una recomendación final.

    RESULTADOS DE EVALUACIÓN:
    ${criteriaResults}

    ESPECIFICACIONES DE LA LICITACIÓN:
    ${specifications
			.map((spec) => `${spec.name}: ${spec.content.substring(0, 1000)}...`)
			.join('\n')}

    PROPUESTA EVALUADA:
    ${proposals
			.map((prop) => `${prop.name}: ${prop.content.substring(0, 1000)}...`)
			.join('\n')}

    INSTRUCCIONES:
    1. Crea un resumen ejecutivo de 2-3 párrafos que sintetice los hallazgos principales
    2. Proporciona una recomendación final clara y justificada
    3. Asigna un nivel de confianza (0.0 a 1.0) basado en la claridad de la documentación
    4. Mantén un tono profesional y objetivo

    FORMATO DE RESPUESTA (JSON):
    {
      "summary": "Resumen ejecutivo de 2-3 párrafos...",
      "recommendation": "Recomendación final clara y justificada...",
      "confidence": 0.85
    }

    Responde SOLO con el JSON, sin texto adicional.
  `;

	try {
		const result = await model.generateContent(prompt);
		const response = result.response.text();

		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const summary = JSON.parse(jsonMatch[0]);
			return {
				summary: summary.summary,
				recommendation: summary.recommendation,
				confidence: summary.confidence,
			};
		} else {
			throw new Error('No se pudo extraer JSON de la respuesta');
		}
	} catch (error) {
		console.error('Error generating executive summary:', error);

		// Calcular puntuación promedio para la recomendación de fallback
		const scores = criteria.map((c) => {
			switch (c.score) {
				case 'CUMPLE_EXITOSAMENTE':
					return 3;
				case 'REGULAR':
					return 2;
				case 'INSUFICIENTE':
					return 1;
				default:
					return 2;
			}
		});

		const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

		return {
			summary: `La propuesta ha sido evaluada según ${
				criteria.length
			} criterios principales. Los resultados muestran un rendimiento ${
				averageScore >= 2.5 ? 'satisfactorio' : 'que requiere mejoras'
			} en la mayoría de aspectos evaluados.`,
			recommendation:
				averageScore >= 2.5
					? 'Se recomienda considerar la propuesta para adjudicación, con las mejoras sugeridas en cada criterio.'
					: 'Se recomienda solicitar aclaraciones o mejoras antes de la adjudicación.',
			confidence: 0.75,
		};
	}
}

// Función principal de evaluación
async function evaluateProposal(
	specifications: FileContent[],
	proposals: FileContent[],
): Promise<EvaluationResult> {
	try {
		// Procesar archivos en servidor (validación y limpieza)
		console.log('Processing files on server...');
		const processedSpecs = await processServerFiles(specifications);
		const processedProposals = await processServerFiles(proposals);

		// 1. Extraer criterios evaluables de las especificaciones
		console.log('Extracting evaluation criteria...');
		const extractedCriteria = await extractEvaluationCriteria(processedSpecs);

		if (extractedCriteria.length === 0) {
			throw new Error(
				'No se pudieron extraer criterios de evaluación de las especificaciones',
			);
		}

		// 2. Evaluar cada criterio
		console.log(`Evaluating ${extractedCriteria.length} criteria...`);
		const criteriaEvaluations: EvaluationCriteria[] = [];

		for (const criterion of extractedCriteria) {
			console.log(`Evaluating: ${criterion}`);
			const evaluation = await evaluateCriterion(
				criterion,
				processedSpecs,
				processedProposals,
			);
			criteriaEvaluations.push(evaluation);
		}

		// 3. Generar resumen ejecutivo y recomendación
		console.log('Generating executive summary...');
		const { summary, recommendation, confidence } =
			await generateExecutiveSummary(
				criteriaEvaluations,
				processedSpecs,
				processedProposals,
			);

		return {
			summary,
			criteria: criteriaEvaluations,
			recommendation,
			confidence,
			extractedCriteria,
		};
	} catch (error) {
		console.error('Error in evaluation process:', error);
		throw error;
	}
}

// Handler de la API
export async function POST(request: NextRequest) {
	try {
		// Verificar que existe la API key
		if (!process.env.GOOGLE_GEMINI_API_KEY) {
			return NextResponse.json(
				{ error: 'Google Gemini API key no configurada' },
				{ status: 500 },
			);
		}

		const { specifications, proposals }: EvaluationRequest =
			await request.json();

		// Validar entrada
		if (
			!specifications ||
			!Array.isArray(specifications) ||
			specifications.length === 0
		) {
			return NextResponse.json(
				{ error: 'Se requieren documentos de especificaciones' },
				{ status: 400 },
			);
		}

		if (!proposals || !Array.isArray(proposals) || proposals.length === 0) {
			return NextResponse.json(
				{ error: 'Se requieren documentos de propuesta' },
				{ status: 400 },
			);
		}

		// Realizar evaluación
		const result = await evaluateProposal(specifications, proposals);

		return NextResponse.json(result);
	} catch (error) {
		console.error('API Error:', error);
		return NextResponse.json(
			{
				error: 'Error interno del servidor',
				details: error instanceof Error ? error.message : 'Error desconocido',
			},
			{ status: 500 },
		);
	}
}

// Función utilitaria para procesar archivos (para uso del frontend)
export function processFileContent(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = async (e) => {
			const arrayBuffer = e.target?.result as ArrayBuffer;

			try {
				if (file.type === 'application/pdf') {
					// Para PDF necesitaríamos una librería como pdf-parse
					// Por ahora, devolvemos placeholder
					resolve(`[Contenido PDF de ${file.name}]`);
				} else if (file.type.includes('word') || file.name.endsWith('.docx')) {
					const mammoth = await import('mammoth');
					const result = await mammoth.extractRawText({ arrayBuffer });
					resolve(result.value);
				} else if (file.type === 'text/plain') {
					resolve(new TextDecoder().decode(arrayBuffer));
				} else {
					reject(new Error('Tipo de archivo no soportado'));
				}
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = () => reject(new Error('Error al leer el archivo'));
		reader.readAsArrayBuffer(file);
	});
}
