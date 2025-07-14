import jsPDF from 'jspdf';
import type { EvaluationResult, BasicInfo, ProposalComparison } from '@/types';

export class PDFGeneratorService {
	private doc: jsPDF;
	private pageWidth: number;
	private pageHeight: number;
	private margin: number = 20;
	private contentWidth: number;
	private currentY: number = 25;

	constructor() {
		this.doc = new jsPDF();
		this.pageWidth = this.doc.internal.pageSize.getWidth();
		this.pageHeight = this.doc.internal.pageSize.getHeight();
		this.contentWidth = this.pageWidth - 2 * this.margin;
	}

	generateEvaluationReport(
		evaluationResult: EvaluationResult,
		basicInfo: BasicInfo,
	): void {
		this.addFirstPageTitle();
		this.currentY = 90;

		this.addGeneralInfo(basicInfo, evaluationResult);

		if (
			evaluationResult.overallSummary &&
			evaluationResult.overallSummary.trim()
		) {
			this.addOverallSummary(evaluationResult);
		}

		this.addLotsEvaluation(evaluationResult);

		if (
			evaluationResult.overallRecommendation &&
			evaluationResult.overallRecommendation.trim()
		) {
			this.addOverallRecommendation(evaluationResult);
		}

		this.addFooter();

		const fileName = `avaluacio_${basicInfo.expedient}_${
			new Date().toISOString().split('T')[0]
		}.pdf`;
		this.doc.save(fileName);
	}

	generateComparisonReport(
		comparison: ProposalComparison,
		basicInfo: BasicInfo,
	): void {
		this.addFirstPageTitle('INFORME COMPARATIU');
		this.currentY = 90;

		this.addComparisonGeneralInfo(basicInfo, comparison);
		this.addComparisonSummary(comparison);
		this.addGlobalRanking(comparison);
		this.addCriteriaComparisonTable(comparison);
		this.addDetailedCriteriaAnalysis(comparison);

		this.addFooter();

		const fileName = `comparacio_lot_${comparison.lotNumber}_${
			new Date().toISOString().split('T')[0]
		}.pdf`;
		this.doc.save(fileName);
	}

	private checkPageBreak(requiredSpace: number): void {
		if (this.currentY + requiredSpace > this.pageHeight - 50) {
			this.addFooter();
			this.doc.addPage();
			this.addSmallHeader();
			this.currentY = 60;
		}
	}

	private addFirstPageTitle(customTitle?: string): void {
		this.doc.setFontSize(24);
		this.doc.setTextColor(25, 152, 117);
		this.doc.setFont('helvetica', 'bold');

		const title = customTitle || "INFORME D'AVALUACIÓ";
		const subtitle = customTitle
			? 'DE PROPOSTES DE LICITACIÓ'
			: 'DE PROPOSTA DE LICITACIÓ';

		this.doc.text(title, this.pageWidth / 2, 40, {
			align: 'center',
		});
		this.doc.text(subtitle, this.pageWidth / 2, 55, {
			align: 'center',
		});

		this.doc.setDrawColor(25, 152, 117);
		this.doc.setLineWidth(1);
		this.doc.line(this.margin, 65, this.pageWidth - this.margin, 65);
	}

	private addSmallHeader(): void {
		this.doc.setFontSize(10);
		this.doc.setTextColor(25, 152, 117);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text(
			"INFORME D'AVALUACIÓ DE PROPOSTA DE LICITACIÓ",
			this.margin,
			25,
		);

		try {
			this.doc.addImage(
				'/optim-people-logo.png',
				'PNG',
				this.pageWidth - 80,
				15,
				60,
				16,
			);
		} catch (error) {
			console.warn("No s'ha pogut carregar el logo:", error);
		}

		this.doc.setDrawColor(25, 152, 117);
		this.doc.setLineWidth(0.5);
		this.doc.line(this.margin, 35, this.pageWidth - this.margin, 35);
	}

	private addFooter(): void {
		const footerY = this.pageHeight - 25;

		this.doc.setFontSize(8);
		this.doc.setTextColor(100, 100, 100);
		this.doc.setFont('helvetica', 'normal');

		this.doc.text('OPTIMPEOPLE S.L.', this.margin, footerY);
		this.doc.text('www.optimpeople.com', this.pageWidth / 2, footerY, {
			align: 'center',
		});
		this.doc.text(
			`Pàgina ${this.doc.getCurrentPageInfo().pageNumber}`,
			this.pageWidth - this.margin,
			footerY,
			{ align: 'right' },
		);

		this.doc.text(
			'c/Doctor Letamendi, 29, baixos 1a  08031 Barcelona',
			this.margin,
			footerY + 8,
		);
		this.doc.text('B67585539', this.pageWidth / 2, footerY + 8, {
			align: 'center',
		});
		this.doc.text(
			'+34 650 891 296',
			this.pageWidth - this.margin,
			footerY + 8,
			{ align: 'right' },
		);

		this.doc.setDrawColor(200, 200, 200);
		this.doc.setLineWidth(0.5);
		this.doc.line(
			this.margin,
			footerY - 5,
			this.pageWidth - this.margin,
			footerY - 5,
		);
	}

	private addWrappedText(
		text: string,
		x: number,
		y: number,
		maxWidth: number,
		lineHeight: number = 5,
	): number {
		const lines = this.doc.splitTextToSize(text, maxWidth);
		this.doc.text(lines, x, y);
		return lines.length * lineHeight;
	}

	private addSectionTitle(title: string): void {
		this.doc.setFontSize(14);
		this.doc.setTextColor(25, 152, 117);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text(title, this.margin, this.currentY);
		this.currentY += 10;
	}

	private addSubSectionTitle(title: string): void {
		this.doc.setFontSize(12);
		this.doc.setTextColor(25, 152, 117);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text(title, this.margin, this.currentY);
		this.currentY += 8;
	}

	private addGeneralInfo(
		basicInfo: BasicInfo,
		evaluationResult: EvaluationResult,
	): void {
		this.addSectionTitle('INFORMACIÓ GENERAL');

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'normal');

		const totalCriteria = evaluationResult.lots.reduce(
			(sum, lot) => sum + lot.criteria.length,
			0,
		);

		const infoItems = [
			['Títol:', basicInfo.title],
			['Expedient:', basicInfo.expedient],
			['Entitat Contractant:', basicInfo.entity || 'No especificat'],
			["Data d'avaluació:", new Date().toLocaleDateString('ca-ES')],
			[
				"Confiança de l'avaluació:",
				`${Math.round(evaluationResult.overallConfidence * 100)}%`,
			],
			['Lots avaluats:', evaluationResult.extractedLots.length.toString()],
			['Total criteris avaluats:', totalCriteria.toString()],
		];

		infoItems.forEach(([label, value]) => {
			this.doc.setFont('helvetica', 'bold');
			this.doc.text(label, this.margin, this.currentY);
			this.doc.setFont('helvetica', 'normal');
			const valueHeight = this.addWrappedText(
				value,
				this.margin + 45,
				this.currentY,
				this.contentWidth - 45,
			);
			this.currentY += Math.max(5, valueHeight);
		});

		if (basicInfo.context) {
			this.currentY += 5;
			this.doc.setFont('helvetica', 'bold');
			this.doc.text('Context Addicional:', this.margin, this.currentY);
			this.currentY += 5;
			this.doc.setFont('helvetica', 'normal');
			const contextHeight = this.addWrappedText(
				basicInfo.context,
				this.margin,
				this.currentY,
				this.contentWidth,
			);
			this.currentY += contextHeight + 5;
		}

		this.currentY += 20;
	}

	private addComparisonGeneralInfo(
		basicInfo: BasicInfo,
		comparison: ProposalComparison,
	): void {
		this.addSectionTitle('INFORMACIÓ GENERAL');

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'normal');

		const infoItems = [
			['Títol:', basicInfo.title],
			['Expedient:', basicInfo.expedient],
			['Entitat Contractant:', basicInfo.entity || 'No especificat'],
			["Data d'avaluació:", new Date().toLocaleDateString('ca-ES')],
			['Lot comparat:', `${comparison.lotNumber} - ${comparison.lotTitle}`],
			['Propostes comparades:', comparison.proposalNames.join(', ')],
			[
				'Confiança de la comparació:',
				`${Math.round(comparison.confidence * 100)}%`,
			],
		];

		infoItems.forEach(([label, value]) => {
			this.doc.setFont('helvetica', 'bold');
			this.doc.text(label, this.margin, this.currentY);
			this.doc.setFont('helvetica', 'normal');
			const valueHeight = this.addWrappedText(
				value,
				this.margin + 45,
				this.currentY,
				this.contentWidth - 45,
			);
			this.currentY += Math.max(5, valueHeight);
		});

		this.currentY += 20;
	}

	private addComparisonSummary(comparison: ProposalComparison): void {
		this.checkPageBreak(40);
		this.addSectionTitle('RESUM EXECUTIU DE LA COMPARACIÓ');

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'normal');
		const summaryHeight = this.addWrappedText(
			comparison.summary,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
		this.currentY += summaryHeight + 15;
	}

	private addGlobalRanking(comparison: ProposalComparison): void {
		this.checkPageBreak(50);
		this.addSectionTitle('RÀNKING GLOBAL');

		comparison.globalRanking.forEach((ranking) => {
			this.checkPageBreak(60);

			// Position and name
			this.doc.setFontSize(12);
			this.doc.setTextColor(25, 152, 117);
			this.doc.setFont('helvetica', 'bold');

			const positionIcon =
				ranking.position === 1
					? '🥇'
					: ranking.position === 2
					? '🥈'
					: ranking.position === 3
					? '🥉'
					: `${ranking.position}°`;
			this.doc.text(
				`${positionIcon} ${ranking.proposalName}`,
				this.margin,
				this.currentY,
			);
			this.currentY += 8;

			// Overall score
			this.doc.setFontSize(10);
			this.doc.setTextColor(60, 60, 60);
			this.doc.setFont('helvetica', 'bold');
			this.doc.text(
				`Puntuació Global: ${ranking.overallScore}`,
				this.margin,
				this.currentY,
			);
			this.currentY += 8;

			// Strengths
			if (ranking.strengths.length > 0) {
				this.doc.setFont('helvetica', 'bold');
				this.doc.setTextColor(25, 152, 117);
				this.doc.text('Punts Forts:', this.margin, this.currentY);
				this.currentY += 5;

				this.doc.setFont('helvetica', 'normal');
				this.doc.setTextColor(24, 136, 105);
				ranking.strengths.forEach((strength) => {
					const strengthHeight = this.addWrappedText(
						`• ${strength}`,
						this.margin + 5,
						this.currentY,
						this.contentWidth - 5,
					);
					this.currentY += Math.max(5, strengthHeight);
				});
				this.currentY += 3;
			}

			// Weaknesses
			if (ranking.weaknesses.length > 0) {
				this.doc.setFont('helvetica', 'bold');
				this.doc.setTextColor(220, 38, 38);
				this.doc.text('Punts Febles:', this.margin, this.currentY);
				this.currentY += 5;

				this.doc.setFont('helvetica', 'normal');
				this.doc.setTextColor(185, 28, 28);
				ranking.weaknesses.forEach((weakness) => {
					const weaknessHeight = this.addWrappedText(
						`• ${weakness}`,
						this.margin + 5,
						this.currentY,
						this.contentWidth - 5,
					);
					this.currentY += Math.max(5, weaknessHeight);
				});
				this.currentY += 3;
			}

			// Recommendation
			this.doc.setFontSize(10);
			this.doc.setTextColor(3, 105, 161);
			this.doc.setFont('helvetica', 'bold');
			this.doc.text('Recomanació:', this.margin, this.currentY);
			this.currentY += 5;

			this.doc.setFont('helvetica', 'normal');
			const recHeight = this.addWrappedText(
				ranking.recommendation,
				this.margin,
				this.currentY,
				this.contentWidth,
			);
			this.currentY += recHeight + 10;

			// Separator
			this.doc.setDrawColor(200, 200, 200);
			this.doc.setLineWidth(0.5);
			this.doc.line(
				this.margin,
				this.currentY + 5,
				this.pageWidth - this.margin,
				this.currentY + 5,
			);
			this.currentY += 15;
		});
	}

	private addCriteriaComparisonTable(comparison: ProposalComparison): void {
		this.checkPageBreak(80);
		this.addSectionTitle('TAULA COMPARATIVA PER CRITERIS');

		const tableStartY = this.currentY;
		const colWidth = this.contentWidth / (comparison.proposalNames.length + 1);
		const rowHeight = 15;

		// Headers
		this.doc.setFillColor(223, 231, 230);
		this.doc.rect(
			this.margin,
			this.currentY,
			this.contentWidth,
			rowHeight,
			'F',
		);

		this.doc.setFontSize(9);
		this.doc.setTextColor(28, 28, 28);
		this.doc.setFont('helvetica', 'bold');

		// Criterion header
		this.doc.text('Criteri', this.margin + 2, this.currentY + 10);

		// Proposal headers
		comparison.proposalNames.forEach((name, index) => {
			const x = this.margin + colWidth + index * colWidth;
			const maxTextWidth = colWidth - 4;
			const lines = this.doc.splitTextToSize(name, maxTextWidth);
			this.doc.text(lines[0], x + 2, this.currentY + 10);
		});

		this.currentY += rowHeight;

		// Rows
		comparison.criteriaComparisons.forEach((criterionComp, rowIndex) => {
			this.checkPageBreak(rowHeight + 5);

			// Alternate row colors
			if (rowIndex % 2 === 0) {
				this.doc.setFillColor(248, 249, 250);
				this.doc.rect(
					this.margin,
					this.currentY,
					this.contentWidth,
					rowHeight,
					'F',
				);
			}

			this.doc.setFontSize(8);
			this.doc.setTextColor(28, 28, 28);
			this.doc.setFont('helvetica', 'normal');

			// Criterion name
			const criterionLines = this.doc.splitTextToSize(
				criterionComp.criterion,
				colWidth - 4,
			);
			this.doc.text(criterionLines[0], this.margin + 2, this.currentY + 10);

			// Proposal scores and positions
			criterionComp.proposals.forEach((proposal, index) => {
				const x = this.margin + colWidth + index * colWidth;

				const positionIcon =
					proposal.position === 1
						? '🥇'
						: proposal.position === 2
						? '🥈'
						: proposal.position === 3
						? '🥉'
						: `${proposal.position}°`;
				const scoreText =
					proposal.score === 'COMPLEIX_EXITOSAMENT'
						? 'Compleix'
						: proposal.score === 'REGULAR'
						? 'Regular'
						: 'Insuficient';

				this.doc.text(
					`${positionIcon} ${scoreText}`,
					x + 2,
					this.currentY + 10,
				);
			});

			this.currentY += rowHeight;
		});

		// Table border
		this.doc.setDrawColor(200, 200, 200);
		this.doc.setLineWidth(0.5);
		this.doc.rect(
			this.margin,
			tableStartY,
			this.contentWidth,
			this.currentY - tableStartY,
		);

		// Vertical lines
		for (let i = 1; i <= comparison.proposalNames.length; i++) {
			const x = this.margin + i * colWidth;
			this.doc.line(x, tableStartY, x, this.currentY);
		}

		this.currentY += 15;
	}

	private addDetailedCriteriaAnalysis(comparison: ProposalComparison): void {
		this.checkPageBreak(50);
		this.addSectionTitle('ANÀLISI DETALLADA PER CRITERIS');

		comparison.criteriaComparisons.forEach((criterionComp, index) => {
			this.checkPageBreak(80);

			this.doc.setFontSize(12);
			this.doc.setTextColor(0, 0, 0);
			this.doc.setFont('helvetica', 'bold');
			const titleHeight = this.addWrappedText(
				`${index + 1}. ${criterionComp.criterion}`,
				this.margin,
				this.currentY,
				this.contentWidth,
			);
			this.currentY += titleHeight + 8;

			criterionComp.proposals.forEach((proposal) => {
				this.checkPageBreak(40);

				// Proposal name and score
				this.doc.setFontSize(10);
				this.doc.setTextColor(25, 152, 117);
				this.doc.setFont('helvetica', 'bold');

				const positionIcon =
					proposal.position === 1
						? '🥇'
						: proposal.position === 2
						? '🥈'
						: proposal.position === 3
						? '🥉'
						: `${proposal.position}°`;
				const scoreText =
					proposal.score === 'COMPLEIX_EXITOSAMENT'
						? 'Compleix exitosament'
						: proposal.score === 'REGULAR'
						? 'Regular'
						: 'Insuficient';

				this.doc.text(
					`${positionIcon} ${proposal.proposalName} - ${scoreText}`,
					this.margin,
					this.currentY,
				);
				this.currentY += 8;

				// Arguments
				this.doc.setFontSize(9);
				this.doc.setTextColor(60, 60, 60);
				this.doc.setFont('helvetica', 'normal');

				proposal.arguments.forEach((argument) => {
					const argHeight = this.addWrappedText(
						`• ${argument}`,
						this.margin + 5,
						this.currentY,
						this.contentWidth - 5,
					);
					this.currentY += Math.max(5, argHeight);
				});

				this.currentY += 5;
			});

			// Separator
			this.doc.setDrawColor(200, 200, 200);
			this.doc.setLineWidth(0.5);
			this.doc.line(
				this.margin,
				this.currentY + 5,
				this.pageWidth - this.margin,
				this.currentY + 5,
			);
			this.currentY += 15;
		});
	}

	private addOverallSummary(evaluationResult: EvaluationResult): void {
		this.checkPageBreak(40);
		this.addSectionTitle('RESUM GENERAL');

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'normal');
		const summaryHeight = this.addWrappedText(
			evaluationResult.overallSummary,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
		this.currentY += summaryHeight + 15;
	}

	private addLotsEvaluation(evaluationResult: EvaluationResult): void {
		const hasMultipleLots = evaluationResult.extractedLots.length > 1;

		// Group evaluations by lot
		const evaluationsByLot = new Map<number, any[]>();
		evaluationResult.lots.forEach((evaluation) => {
			if (!evaluationsByLot.has(evaluation.lotNumber)) {
				evaluationsByLot.set(evaluation.lotNumber, []);
			}
			evaluationsByLot.get(evaluation.lotNumber)!.push(evaluation);
		});

		evaluationResult.extractedLots.forEach((lotInfo) => {
			const lotEvaluations = evaluationsByLot.get(lotInfo.lotNumber) || [];

			this.checkPageBreak(50);

			if (hasMultipleLots) {
				this.addSectionTitle(`LOT ${lotInfo.lotNumber}: ${lotInfo.title}`);
			} else {
				this.addSectionTitle('AVALUACIÓ DETALLADA PER CRITERIS');
			}

			if (lotEvaluations.length === 0) {
				this.doc.setFillColor(255, 243, 205);
				this.doc.rect(
					this.margin,
					this.currentY - 2.5,
					this.contentWidth,
					20,
					'F',
				);

				this.doc.setFontSize(10);
				this.doc.setTextColor(133, 100, 4);
				this.doc.setFont('helvetica', 'bold');
				this.doc.text(
					`No s'ha presentat proposta per aquest lot`,
					this.margin + 5,
					this.currentY + 5,
				);
				this.currentY += 25;
				return;
			}

			lotEvaluations.forEach((evaluation, evalIndex) => {
				if (lotEvaluations.length > 1) {
					this.checkPageBreak(20);
					this.addSubSectionTitle(`Proposta: ${evaluation.proposalName}`);
				}

				if (hasMultipleLots || lotEvaluations.length > 1) {
					this.checkPageBreak(20);

					this.doc.setFontSize(10);
					this.doc.setTextColor(60, 60, 60);
					this.doc.setFont('helvetica', 'bold');
					this.doc.text(
						lotEvaluations.length > 1
							? `Resum - ${evaluation.proposalName}:`
							: 'Resum del Lot:',
						this.margin,
						this.currentY,
					);
					this.currentY += 8;

					this.doc.setFontSize(10);
					this.doc.setTextColor(60, 60, 60);
					this.doc.setFont('helvetica', 'normal');
					const contentHeight = this.addWrappedText(
						evaluation.summary,
						this.margin,
						this.currentY,
						this.contentWidth,
					);
					this.currentY += contentHeight + 10;
				}

				if (evaluation.criteria.length > 0) {
					this.checkPageBreak(30);

					if (hasMultipleLots || lotEvaluations.length > 1) {
						this.addSubSectionTitle(
							lotEvaluations.length > 1
								? `Criteris - ${evaluation.proposalName}`
								: 'Criteris Identificats',
						);
					} else {
						this.addSubSectionTitle('CRITERIS IDENTIFICATS');
					}

					evaluation.criteria.forEach((criterion: any) => {
						this.checkPageBreak(8);

						this.doc.setFontSize(9);
						this.doc.setTextColor(60, 60, 60);
						this.doc.setFont('helvetica', 'normal');

						const criteriaHeight = this.addWrappedText(
							`• ${criterion.criterion}`,
							this.margin + 5,
							this.currentY,
							this.contentWidth - 10,
							5,
						);
						this.currentY += Math.max(5, criteriaHeight);
					});

					this.currentY += 10;
				}

				if (hasMultipleLots || lotEvaluations.length > 1) {
					this.addSubSectionTitle(
						lotEvaluations.length > 1
							? `Avaluació - ${evaluation.proposalName}`
							: 'Avaluació per Criteris',
					);
				}

				evaluation.criteria.forEach(
					(criterion: any, criterionIndex: number) => {
						this.checkPageBreak(80);
						this.addCriterionEvaluation(criterion, criterionIndex + 1);
					},
				);

				if (hasMultipleLots || lotEvaluations.length > 1) {
					this.checkPageBreak(30);

					this.doc.setFontSize(12);
					this.doc.setTextColor(3, 105, 161);
					this.doc.setFont('helvetica', 'bold');
					this.doc.text(
						lotEvaluations.length > 1
							? `Anàlisi - ${evaluation.proposalName}:`
							: `Anàlisi per Lot ${evaluation.lotNumber}:`,
						this.margin,
						this.currentY,
					);
					this.currentY += 10;

					this.doc.setFontSize(10);
					this.doc.setTextColor(3, 105, 161);
					this.doc.setFont('helvetica', 'normal');
					const contentHeight = this.addWrappedText(
						evaluation.recommendation,
						this.margin,
						this.currentY,
						this.contentWidth,
					);
					this.currentY += contentHeight + 10;
				} else {
					this.checkPageBreak(30);

					this.doc.setFontSize(12);
					this.doc.setTextColor(3, 105, 161);
					this.doc.setFont('helvetica', 'bold');
					this.doc.text('Anàlisi de la Proposta:', this.margin, this.currentY);
					this.currentY += 10;

					this.doc.setFontSize(10);
					this.doc.setTextColor(3, 105, 161);
					this.doc.setFont('helvetica', 'normal');
					const contentHeight = this.addWrappedText(
						evaluation.recommendation,
						this.margin,
						this.currentY,
						this.contentWidth,
					);
					this.currentY += contentHeight + 10;
				}

				if (evalIndex < lotEvaluations.length - 1) {
					this.currentY += 10;
				}
			});
		});
	}

	private addCriterionEvaluation(criterion: any, index: number): void {
		this.doc.setFontSize(12);
		this.doc.setTextColor(0, 0, 0);
		this.doc.setFont('helvetica', 'bold');
		const criterionTitle = `${index}. ${criterion.criterion}`;
		const titleHeight = this.addWrappedText(
			criterionTitle,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
		this.currentY += titleHeight + 5;

		const scoreTexts = {
			COMPLEIX_EXITOSAMENT: 'Compleix exitosament',
			REGULAR: 'Regular',
			INSUFICIENT: 'Insuficient',
		};

		this.doc.setFontSize(10);
		this.doc.setTextColor(0, 0, 0);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text(
			`Puntuació: ${scoreTexts[criterion.score as keyof typeof scoreTexts]}`,
			this.margin,
			this.currentY,
		);
		this.currentY += 10;

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('Explicació:', this.margin, this.currentY);
		this.currentY += 5;

		this.doc.setFont('helvetica', 'normal');
		const justificationHeight = this.addWrappedText(
			criterion.justification,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
		this.currentY += justificationHeight + 8;

		if (criterion.strengths.length > 0) {
			this.checkPageBreak(20 + criterion.strengths.length * 5);

			this.doc.setFontSize(10);
			this.doc.setTextColor(25, 152, 117);
			this.doc.setFont('helvetica', 'bold');
			this.doc.text('Punts Forts:', this.margin, this.currentY);
			this.currentY += 5;

			this.doc.setFontSize(9);
			this.doc.setTextColor(24, 136, 105);
			this.doc.setFont('helvetica', 'normal');

			criterion.strengths.forEach((strength: string) => {
				this.checkPageBreak(8);
				const strengthHeight = this.addWrappedText(
					`• ${strength}`,
					this.margin + 5,
					this.currentY,
					this.contentWidth - 5,
				);
				this.currentY += Math.max(5, strengthHeight);
			});

			this.currentY += 5;
		}

		if (criterion.improvements.length > 0) {
			this.checkPageBreak(20 + criterion.improvements.length * 5);

			this.doc.setFontSize(10);
			this.doc.setTextColor(220, 38, 38);
			this.doc.setFont('helvetica', 'bold');
			this.doc.text('Àrees de Millora:', this.margin, this.currentY);
			this.currentY += 5;

			this.doc.setFontSize(9);
			this.doc.setTextColor(185, 28, 28);
			this.doc.setFont('helvetica', 'normal');

			criterion.improvements.forEach((improvement: string) => {
				this.checkPageBreak(8);
				const improvementHeight = this.addWrappedText(
					`• ${improvement}`,
					this.margin + 5,
					this.currentY,
					this.contentWidth - 5,
				);
				this.currentY += Math.max(5, improvementHeight);
			});

			this.currentY += 5;
		}

		if (criterion.references.length > 0) {
			this.checkPageBreak(20);

			this.doc.setFontSize(9);
			this.doc.setTextColor(100, 100, 100);
			this.doc.setFont('helvetica', 'italic');
			const referencesText = 'Referències: ' + criterion.references.join(', ');
			const referencesHeight = this.addWrappedText(
				referencesText,
				this.margin,
				this.currentY,
				this.contentWidth,
			);
			this.currentY += referencesHeight;
		}

		this.checkPageBreak(15);
		this.doc.setDrawColor(200, 200, 200);
		this.doc.setLineWidth(0.5);
		this.doc.line(
			this.margin,
			this.currentY + 5,
			this.pageWidth - this.margin,
			this.currentY + 5,
		);
		this.currentY += 15;
	}

	private addOverallRecommendation(evaluationResult: EvaluationResult): void {
		this.checkPageBreak(50);

		this.doc.setFontSize(14);
		this.doc.setTextColor(25, 152, 117);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('ANÀLISI GENERAL', this.margin, this.currentY);
		this.currentY += 12;

		this.doc.setFontSize(10);
		this.doc.setTextColor(3, 105, 161);
		this.doc.setFont('helvetica', 'normal');

		const lines = this.doc.splitTextToSize(
			evaluationResult.overallRecommendation,
			this.contentWidth,
		);
		const contentHeight = lines.length * 5;
		this.checkPageBreak(contentHeight + 10);

		this.addWrappedText(
			evaluationResult.overallRecommendation,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
	}
}

export const pdfGenerator = new PDFGeneratorService();
