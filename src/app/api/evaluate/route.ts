import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { processServerFiles } from '@/lib/pdfProcessor';
import type {
	EvaluationCriteria,
	EvaluationResult,
	FileContent,
	EvaluationRequest,
} from '@/types';

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY!,
});

async function extractEvaluationCriteria(
	specifications: FileContent[],
): Promise<string[]> {
	const specsContent = specifications
		.map(
			(spec) => `
    === DOCUMENT: ${spec.name} ===
    ${spec.content}
  `,
		)
		.join('\n\n');

	const prompt = `
    Analitza els següents documents d'especificacions de licitació i extreu ÚNICAMENT els criteris SUBJECTIUS que requereixen avaluació qualitativa.

    DOCUMENTS D'ESPECIFICACIONS:
    ${specsContent}

    INSTRUCCIONS:
    1. Identifica només criteris que requereixen avaluació subjectiva/qualitativa
    2. Exclou requisits tècnics objectius (com "ha de tenir certificació X")
    3. Inclou aspectes com: experiència, metodologia, qualitat, innovació, organització, etc.
    4. Cada criteri ha de ser avaluable en termes de qualitat/adequació
    5. Màxim 8 criteris per mantenir l'avaluació manejable

    FORMAT DE RESPOSTA:
    Respon NOMÉS amb una llista JSON de strings, sense explicacions addicionals:
    ["Criteri 1", "Criteri 2", "Criteri 3", ...]

    EXEMPLE:
    ["Experiència i capacitat tècnica de l'equip", "Metodologia i planificació del projecte", "Qualitat de la proposta tècnica", "Innovació i valor afegit"]
  `;

	try {
		const config = {
			responseMimeType: 'application/json',
			temperature: 0.3,
		};

		const contents = [
			{
				role: 'user' as const,
				parts: [
					{
						text: prompt,
					},
				],
			},
		];

		const response = await ai.models.generateContent({
			model: 'gemini-2.0-flash-lite',
			config,
			contents,
		});

		if (!response?.text) {
			throw new Error("No s'han rebut candidats en la resposta de Gemini");
		}

		try {
			const criteria = JSON.parse(response.text);
			return Array.isArray(criteria) ? criteria : [];
		} catch (parseError) {
			console.error('Error parsing criteria JSON:', parseError);
			return extractCriteriaFromText(response.text);
		}
	} catch (error) {
		console.error('Error extracting criteria:', error);
		return [];
	}
}

function extractCriteriaFromText(text: string): string[] {
	const lines = text.split('\n');
	const criteria: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.length > 10 && trimmed.length < 100) {
			const cleaned = trimmed
				.replace(/^[\d\-\*\•\.\)]+\s*/, '')
				.replace(/["\[\]]/g, '');
			if (cleaned.length > 5) {
				criteria.push(cleaned);
			}
		}
	}

	return criteria.slice(0, 8);
}

async function evaluateCriterion(
	criterion: string,
	specifications: FileContent[],
	proposals: FileContent[],
): Promise<EvaluationCriteria> {
	const specsContent = specifications
		.map(
			(spec) => `
    === ESPECIFICACIÓ: ${spec.name} ===
    ${spec.content}
  `,
		)
		.join('\n\n');

	const proposalContent = proposals
		.map(
			(proposal) => `
    === PROPOSTA: ${proposal.name} ===
    ${proposal.content}
  `,
		)
		.join('\n\n');

	const prompt = `
    Avalua el següent criteri basant-te en les especificacions de la licitació i la proposta presentada.

    CRITERI A AVALUAR: ${criterion}

    ESPECIFICACIONS DE LA LICITACIÓ:
    ${specsContent}

    PROPOSTA A AVALUAR:
    ${proposalContent}

    INSTRUCCIONS PER A L'AVALUACIÓ:
    1. Analitza què es requereix segons les especificacions per a aquest criteri
    2. Avalua com compleix la proposta amb aquests requisits
    3. Assigna una d'aquestes qualificacions:
       - INSUFICIENT: No compleix requisits mínims
       - REGULAR: Compleix parcialment els requisits
       - COMPLEIX_EXITOSAMENT: Supera les expectatives
    
    4. Proporciona una justificació detallada (mínim 100 paraules)
    5. Identifica 2-4 punts forts específics
    6. Identifica 2-4 àrees de millora específiques
    7. Referencia seccions específiques de les especificacions

    FORMAT DE RESPOSTA (JSON):
    {
      "score": "INSUFICIENT|REGULAR|COMPLEIX_EXITOSAMENT",
      "justification": "Justificació detallada d'almenys 100 paraules...",
      "strengths": ["Punt fort 1", "Punt fort 2", "Punt fort 3"],
      "improvements": ["Millora 1", "Millora 2", "Millora 3"],
      "references": ["Referència 1", "Referència 2"]
    }

    Respon NOMÉS amb el JSON, sense text addicional.
  `;

	try {
		const config = {
			responseMimeType: 'application/json',
			temperature: 0.3,
		};

		const contents = [
			{
				role: 'user' as const,
				parts: [
					{
						text: prompt,
					},
				],
			},
		];

		const response = await ai.models.generateContent({
			model: 'gemini-2.0-flash-lite',
			config,
			contents,
		});

		if (!response?.text) {
			throw new Error("No s'ha rebut resposta de Gemini per al criteri");
		}

		const jsonMatch = response?.text.match(/\{[\s\S]*\}/);
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
			throw new Error("No s'ha pogut extreure JSON de la resposta");
		}
	} catch (error) {
		console.error(`Error evaluating criterion "${criterion}":`, error);

		return {
			criterion,
			score: 'REGULAR',
			justification: `No s'ha pogut avaluar automàticament el criteri "${criterion}". Es requereix revisió manual.`,
			strengths: ['Revisió manual requerida'],
			improvements: ['Avaluació automàtica fallida'],
			references: ['Error en processament'],
		};
	}
}

async function generateExecutiveSummary(
	criteria: EvaluationCriteria[],
	specifications: FileContent[],
	proposals: FileContent[],
): Promise<{ summary: string; recommendation: string; confidence: number }> {
	const criteriaResults = criteria
		.map(
			(c) => `
    - ${c.criterion}: ${c.score}
    ${c.justification}
  `,
		)
		.join('\n');

	const prompt = `
    Basant-te en els següents resultats d'avaluació, genera un resum executiu i una recomanació final.

    RESULTATS D'AVALUACIÓ:
    ${criteriaResults}

    ESPECIFICACIONS DE LA LICITACIÓ:
    ${specifications
			.map((spec) => `${spec.name}: ${spec.content.substring(0, 1000)}...`)
			.join('\n')}

    PROPOSTA AVALUADA:
    ${proposals
			.map((prop) => `${prop.name}: ${prop.content.substring(0, 1000)}...`)
			.join('\n')}

    INSTRUCCIONS:
    1. Crea un resum executiu de 2-3 paràgrafs que sintetitzi les troballes principals
    2. Proporciona una recomanació final clara i justificada
    3. Assigna un nivell de confiança (0.0 a 1.0) basat en la claredat de la documentació
    4. Mantén un to professional i objectiu
    5. Respon en català

    FORMAT DE RESPOSTA (JSON):
    {
      "summary": "Resum executiu de 2-3 paràgrafs...",
      "recommendation": "Recomanació final clara i justificada...",
      "confidence": 0.85
    }

    Respon NOMÉS amb el JSON, sense text addicional.
  `;

	try {
		const config = {
			responseMimeType: 'application/json',
			temperature: 0.3,
		};

		const contents = [
			{
				role: 'user' as const,
				parts: [
					{
						text: prompt,
					},
				],
			},
		];

		const response = await ai.models.generateContent({
			model: 'gemini-2.0-flash-lite',
			config,
			contents,
		});

		if (!response?.text) {
			throw new Error("No s'ha rebut resposta de Gemini per al resum executiu");
		}

		const jsonMatch = response.text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const summary = JSON.parse(jsonMatch[0]);
			return {
				summary: summary.summary,
				recommendation: summary.recommendation,
				confidence: summary.confidence,
			};
		} else {
			throw new Error("No s'ha pogut extreure JSON de la resposta");
		}
	} catch (error) {
		console.error('Error generating executive summary:', error);

		const scores = criteria.map((c) => {
			switch (c.score) {
				case 'COMPLEIX_EXITOSAMENT':
					return 3;
				case 'REGULAR':
					return 2;
				case 'INSUFICIENT':
					return 1;
				default:
					return 2;
			}
		});

		const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

		return {
			summary: `La proposta ha estat avaluada segons ${
				criteria.length
			} criteris principals. Els resultats mostren un rendiment ${
				averageScore >= 2.5 ? 'satisfactori' : 'que requereix millores'
			} en la majoria d'aspectes avaluats.`,
			recommendation:
				averageScore >= 2.5
					? 'Es recomana considerar la proposta per a adjudicació, amb les millores suggerides a cada criteri.'
					: "Es recomana sol·licitar aclariments o millores abans de l'adjudicació.",
			confidence: 0.75,
		};
	}
}

async function evaluateProposal(
	specifications: FileContent[],
	proposals: FileContent[],
): Promise<EvaluationResult> {
	try {
		console.log('Processing files on server...');
		const processedSpecs = await processServerFiles(specifications);
		const processedProposals = await processServerFiles(proposals);

		console.log('Extracting evaluation criteria...');
		const extractedCriteria = await extractEvaluationCriteria(processedSpecs);

		if (extractedCriteria.length === 0) {
			throw new Error(
				"No s'han pogut extreure criteris d'avaluació de les especificacions",
			);
		}

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

export async function POST(request: NextRequest) {
	try {
		if (!process.env.GEMINI_API_KEY) {
			return NextResponse.json(
				{ error: 'Gemini API key no configurada' },
				{ status: 500 },
			);
		}

		const { specifications, proposals }: EvaluationRequest =
			await request.json();

		if (
			!specifications ||
			!Array.isArray(specifications) ||
			specifications.length === 0
		) {
			return NextResponse.json(
				{ error: "Es requereixen documents d'especificacions" },
				{ status: 400 },
			);
		}

		if (!proposals || !Array.isArray(proposals) || proposals.length === 0) {
			return NextResponse.json(
				{ error: 'Es requereixen documents de proposta' },
				{ status: 400 },
			);
		}

		const result = await evaluateProposal(specifications, proposals);

		return NextResponse.json(result);
	} catch (error) {
		console.error('API Error:', error);
		return NextResponse.json(
			{
				error: 'Error intern del servidor',
				details: error instanceof Error ? error.message : 'Error desconegut',
			},
			{ status: 500 },
		);
	}
}

export function processFileContent(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = async (e) => {
			const arrayBuffer = e.target?.result as ArrayBuffer;

			try {
				if (file.type === 'application/pdf') {
					resolve(`[Contingut PDF de ${file.name}]`);
				} else if (file.type.includes('word') || file.name.endsWith('.docx')) {
					const mammoth = await import('mammoth');
					const result = await mammoth.extractRawText({ arrayBuffer });
					resolve(result.value);
				} else if (file.type === 'text/plain') {
					resolve(new TextDecoder().decode(arrayBuffer));
				} else {
					reject(new Error("Tipus d'arxiu no suportat"));
				}
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = () => reject(new Error("Error en llegir l'arxiu"));
		reader.readAsArrayBuffer(file);
	});
}
