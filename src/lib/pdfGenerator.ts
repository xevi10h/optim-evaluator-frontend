import jsPDF from 'jspdf';
import type {
	EvaluationResult,
	BasicInfo,
	ProposalComparison,
	LotEvaluation,
} from '@/types';
import { getDisplayName, hasCompanyInfo } from '@/types';
import { PDFTableUtils } from './pdfTableUtils';

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
		specificEvaluation?: LotEvaluation,
	): void {
		this.addFirstPageTitle();
		this.currentY = 90;

		if (specificEvaluation) {
			this.addGeneralInfoForSingleEvaluation(basicInfo, specificEvaluation);
			this.addSingleEvaluationContent(specificEvaluation);
		} else {
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
		}

		// Assegurar que hi ha espai suficient per al footer
		this.checkPageBreak(50);
		this.addFooter();

		const fileName = specificEvaluation
			? this.generateFileName(basicInfo, specificEvaluation)
			: `avaluacio_${basicInfo.expedient}_${
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

		// Assegurar que hi ha espai suficient per al footer
		this.checkPageBreak(50);
		this.addFooter();

		const fileName = `comparacio_lot_${comparison.lotNumber}_${
			new Date().toISOString().split('T')[0]
		}.pdf`;
		this.doc.save(fileName);
	}

	private generateFileName(
		basicInfo: BasicInfo,
		evaluation: LotEvaluation,
	): string {
		const dateStr = new Date().toISOString().split('T')[0];
		const companyPart = evaluation.companyName
			? this.cleanFileName(evaluation.companyName)
			: this.cleanFileName(evaluation.proposalName);

		return `avaluacio_${basicInfo.expedient}_${companyPart}_${dateStr}.pdf`;
	}

	private addSingleEvaluationContent(evaluation: LotEvaluation): void {
		this.checkPageBreak(30);
		this.addSectionTitle(`AVALUACIÓ DETALLADA`);

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('Resum de la Proposta:', this.margin, this.currentY);
		this.currentY += 8;

		this.doc.setFont('helvetica', 'normal');
		const summaryHeight = this.addFormattedText(
			evaluation.summary,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
		this.currentY += summaryHeight + 15;

		if (evaluation.criteria.length > 0) {
			this.addSubSectionTitle('CRITERIS AVALUATS');

			evaluation.criteria.forEach((criterion, index) => {
				this.checkPageBreak(80);
				this.addCriterionEvaluation(criterion, index + 1);
			});
		}

		this.checkPageBreak(30);
		this.doc.setFontSize(12);
		this.doc.setTextColor(3, 105, 161);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('Anàlisi de la Proposta:', this.margin, this.currentY);
		this.currentY += 10;

		this.doc.setFontSize(10);
		this.doc.setTextColor(3, 105, 161);
		this.doc.setFont('helvetica', 'normal');
		const recommendationHeight = this.addFormattedText(
			evaluation.recommendation,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
		this.currentY += recommendationHeight + 10;
	}

	private addGeneralInfoForSingleEvaluation(
		basicInfo: BasicInfo,
		evaluation: LotEvaluation,
	): void {
		this.addSectionTitle('INFORMACIÓ GENERAL');

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'normal');

		const displayName = getDisplayName(
			evaluation.companyName,
			evaluation.proposalName,
		);
		const showCompanyInfo = hasCompanyInfo(evaluation);

		const infoItems = [
			['Títol:', basicInfo.title],
			['Expedient:', basicInfo.expedient],
			['Entitat Contractant:', basicInfo.entity || 'No especificat'],
			["Data d'avaluació:", new Date().toLocaleDateString('ca-ES')],
			[
				showCompanyInfo ? 'Empresa avaluada:' : 'Document avaluat:',
				displayName,
			],
			['Lot:', `${evaluation.lotNumber} - ${evaluation.lotTitle}`],
			[
				"Confiança de l'avaluació:",
				`${Math.round(evaluation.confidence * 100)}%`,
			],
			['Criteris avaluats:', evaluation.criteria.length.toString()],
		];

		if (showCompanyInfo) {
			infoItems.push([
				"Confiança d'identificació empresa:",
				`${Math.round(evaluation.companyConfidence * 100)}%`,
			]);
		}

		infoItems.forEach(([label, value]) => {
			this.doc.setFont('helvetica', 'bold');
			this.doc.text(label, this.margin, this.currentY);
			this.doc.setFont('helvetica', 'normal');
			const valueHeight = this.addWrappedText(
				value,
				this.margin + 50,
				this.currentY,
				this.contentWidth - 50,
			);
			this.currentY += Math.max(6, valueHeight + 1);
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

		// Crear llista de noms d'empreses/documents
		const displayNames = comparison.proposalNames.map((name, index) => {
			const companyName = comparison.companyNames[index];
			return getDisplayName(companyName, name);
		});

		const cleanDisplayNames = displayNames.map((name) =>
			this.cleanFileName(name),
		);

		const infoItems = [
			['Títol:', basicInfo.title],
			['Expedient:', basicInfo.expedient],
			['Entitat Contractant:', basicInfo.entity || 'No especificat'],
			["Data d'avaluació:", new Date().toLocaleDateString('ca-ES')],
			['Lot comparat:', `${comparison.lotNumber} - ${comparison.lotTitle}`],
			['Empreses/Propostes comparades:', cleanDisplayNames.join(', ')],
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
				this.margin + 50,
				this.currentY,
				this.contentWidth - 50,
			);
			this.currentY += Math.max(6, valueHeight + 1);
		});

		this.currentY += 20;
	}

	private addGlobalRanking(comparison: ProposalComparison): void {
		this.checkPageBreak(50);
		this.addSectionTitle("RÀNKING GLOBAL D'EMPRESES");

		comparison.globalRanking.forEach((ranking) => {
			this.checkPageBreak(80);

			const displayName = this.cleanFileName(
				getDisplayName(ranking.companyName, ranking.proposalName),
			);

			this.doc.setFontSize(12);
			this.doc.setTextColor(25, 152, 117);
			this.doc.setFont('helvetica', 'bold');

			const positionIcon =
				ranking.position === 1
					? '1r'
					: ranking.position === 2
					? '2n'
					: ranking.position === 3
					? '3r'
					: `${ranking.position}è`;

			this.doc.text(
				`${positionIcon} - ${displayName}`,
				this.margin,
				this.currentY,
			);
			this.currentY += 8;

			this.doc.setFontSize(10);
			this.doc.setTextColor(60, 60, 60);
			this.doc.setFont('helvetica', 'bold');
			this.doc.text(
				`Puntuació Global: ${ranking.overallScore}`,
				this.margin,
				this.currentY,
			);
			this.currentY += 8;

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

			this.doc.setFontSize(10);
			this.doc.setTextColor(3, 105, 161);
			this.doc.setFont('helvetica', 'bold');
			this.doc.text('Recomanació:', this.margin, this.currentY);
			this.currentY += 5;

			this.doc.setFont('helvetica', 'normal');
			const recHeight = this.addFormattedText(
				ranking.recommendation,
				this.margin,
				this.currentY,
				this.contentWidth,
			);
			this.currentY += recHeight + 10;

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

		const tableUtils = new PDFTableUtils(
			this.doc,
			this.margin,
			this.contentWidth,
		);

		// Crear noms d'empreses/documents per la taula
		const displayNames = comparison.proposalNames.map((name, index) => {
			const companyName = comparison.companyNames[index];
			const displayName = getDisplayName(companyName, name);
			// Abreujar per la taula
			return displayName.length > 25
				? `${displayName.substring(0, 22)}...`
				: displayName;
		});

		const endY = tableUtils.createComparisonTable(
			comparison.criteriaComparisons,
			displayNames,
			this.currentY,
		);

		this.currentY = endY + 15;
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

				const displayName = this.cleanFileName(
					getDisplayName(proposal.companyName, proposal.proposalName),
				);

				this.doc.setFontSize(10);
				this.doc.setTextColor(25, 152, 117);
				this.doc.setFont('helvetica', 'bold');

				const positionIcon =
					proposal.position === 1
						? '1r'
						: proposal.position === 2
						? '2n'
						: proposal.position === 3
						? '3r'
						: `${proposal.position}è`;

				const scoreText =
					proposal.score === 'COMPLEIX_EXITOSAMENT'
						? 'Compleix exitosament'
						: proposal.score === 'REGULAR'
						? 'Regular'
						: 'Insuficient';

				this.doc.text(
					`${positionIcon} ${displayName} - ${scoreText}`,
					this.margin,
					this.currentY,
				);
				this.currentY += 8;

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

		const companiesIdentified = evaluationResult.lots.filter(
			(lot) => lot.hasProposal && hasCompanyInfo(lot),
		).length;

		const totalProposals = evaluationResult.lots.filter(
			(lot) => lot.hasProposal,
		).length;

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
			['Total propostes avaluades:', totalProposals.toString()],
			['Empreses identificades:', `${companiesIdentified}/${totalProposals}`],
			['Total criteris avaluats:', totalCriteria.toString()],
		];

		infoItems.forEach(([label, value]) => {
			this.doc.setFont('helvetica', 'bold');
			this.doc.text(label, this.margin, this.currentY);
			this.doc.setFont('helvetica', 'normal');
			const valueHeight = this.addWrappedText(
				value,
				this.margin + 50,
				this.currentY,
				this.contentWidth - 50,
			);
			this.currentY += Math.max(6, valueHeight + 1);
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

	private addLotsEvaluation(evaluationResult: EvaluationResult): void {
		const hasMultipleLots = evaluationResult.extractedLots.length > 1;

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
				const displayName = getDisplayName(
					evaluation.companyName,
					evaluation.proposalName,
				);

				if (lotEvaluations.length > 1) {
					this.checkPageBreak(20);
					this.addSubSectionTitle(`Empresa/Proposta: ${displayName}`);
				}

				if (hasMultipleLots || lotEvaluations.length > 1) {
					this.addSubSectionTitle(
						lotEvaluations.length > 1
							? `Avaluació - ${displayName}`
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
							? `Anàlisi - ${displayName}:`
							: `Anàlisi per Lot ${evaluation.lotNumber}:`,
						this.margin,
						this.currentY,
					);
					this.currentY += 10;

					this.doc.setFontSize(10);
					this.doc.setTextColor(3, 105, 161);
					this.doc.setFont('helvetica', 'normal');
					const contentHeight = this.addFormattedText(
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
					const contentHeight = this.addFormattedText(
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

	private addComparisonSummary(comparison: ProposalComparison): void {
		this.checkPageBreak(40);
		this.addSectionTitle('RESUM EXECUTIU DE LA COMPARACIÓ');

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'normal');
		const summaryHeight = this.addFormattedText(
			comparison.summary,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
		this.currentY += summaryHeight + 15;
	}

	private addOverallSummary(evaluationResult: EvaluationResult): void {
		this.checkPageBreak(40);
		this.addSectionTitle('RESUM GENERAL');

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'normal');
		const summaryHeight = this.addFormattedText(
			evaluationResult.overallSummary,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
		this.currentY += summaryHeight + 15;
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

		this.addFormattedText(
			evaluationResult.overallRecommendation,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
	}

	// Mètodes auxiliars
	private checkPageBreak(requiredSpace: number): void {
		const footerSpace = 60;
		if (this.currentY + requiredSpace > this.pageHeight - footerSpace) {
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

	private cleanFileName(fileName: string): string {
		return fileName
			.replace(/[^\x20-\x7E]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
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

	private addFormattedText(
		text: string,
		x: number,
		y: number,
		maxWidth: number,
		lineHeight: number = 5,
	): number {
		const parts = this.parseFormattedText(text);
		let currentY = y;

		for (const part of parts) {
			this.doc.setFont('helvetica', part.isBold ? 'bold' : 'normal');

			const lines = this.doc.splitTextToSize(part.text, maxWidth);
			this.doc.text(lines, x, currentY);
			currentY += lines.length * lineHeight;
		}

		return currentY - y;
	}

	private parseFormattedText(
		text: string,
	): Array<{ text: string; isBold: boolean }> {
		const parts: Array<{ text: string; isBold: boolean }> = [];

		let cleanText = text
			.replace(/\*\s+/g, '')
			.replace(/\s+\*/g, '')
			.replace(/\*{1}([^*]+)\*{1}/g, '$1')
			.replace(/\*{3,}/g, '');

		const regex = /\*\*(.*?)\*\*/g;
		let lastIndex = 0;
		let match;

		while ((match = regex.exec(cleanText)) !== null) {
			if (match.index > lastIndex) {
				const beforeText = cleanText.substring(lastIndex, match.index);
				if (beforeText.trim()) {
					parts.push({ text: beforeText, isBold: false });
				}
			}

			parts.push({ text: match[1], isBold: true });
			lastIndex = regex.lastIndex;
		}

		if (lastIndex < cleanText.length) {
			const remainingText = cleanText.substring(lastIndex);
			if (remainingText.trim()) {
				parts.push({ text: remainingText, isBold: false });
			}
		}

		if (parts.length === 0) {
			parts.push({ text: cleanText, isBold: false });
		}

		return parts;
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
		const justificationHeight = this.addFormattedText(
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

			const validReferences = criterion.references.filter((ref: string) => {
				const cleanRef = ref.toLowerCase().trim();
				return (
					!cleanRef.includes('error') &&
					!cleanRef.includes('revisió manual') &&
					!cleanRef.includes('processament automàtic') &&
					cleanRef.length > 10 &&
					cleanRef.length < 200
				);
			});

			if (validReferences.length > 0) {
				this.doc.setFontSize(9);
				this.doc.setTextColor(100, 100, 100);
				this.doc.setFont('helvetica', 'italic');

				const referencesText = 'Referències: ' + validReferences.join(', ');
				const referencesHeight = this.addWrappedText(
					referencesText,
					this.margin,
					this.currentY,
					this.contentWidth,
				);
				this.currentY += referencesHeight;
			}
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
}

export const pdfGenerator = new PDFGeneratorService();
