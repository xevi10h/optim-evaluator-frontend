import jsPDF from 'jspdf';
import type { EvaluationResult, BasicInfo } from '@/types';

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
		this.addExtractedCriteria(evaluationResult.extractedCriteria);
		this.addExecutiveSummary(evaluationResult.summary);
		this.addDetailedEvaluation(evaluationResult.criteria);
		this.addFinalRecommendation(evaluationResult.recommendation);

		this.addFooter();

		const fileName = `avaluacio_${basicInfo.expedient}_${
			new Date().toISOString().split('T')[0]
		}.pdf`;
		this.doc.save(fileName);
	}

	private checkPageBreak(requiredSpace: number): void {
		if (this.currentY + requiredSpace > this.pageHeight - 40) {
			this.addFooter();
			this.doc.addPage();
			this.addSmallHeader();
			this.currentY = 60;
		}
	}

	private addFirstPageTitle(): void {
		this.doc.setFontSize(24);
		this.doc.setTextColor(25, 152, 117);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text("INFORME D'AVALUACIÓ", this.pageWidth / 2, 40, {
			align: 'center',
		});
		this.doc.text('DE PROPOSTA DE LICITACIÓ', this.pageWidth / 2, 55, {
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

	private addGeneralInfo(
		basicInfo: BasicInfo,
		evaluationResult: EvaluationResult,
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
			[
				"Confiança de l'avaluació:",
				`${Math.round(evaluationResult.confidence * 100)}%`,
			],
			['Criteris avaluats:', evaluationResult.criteria.length.toString()],
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

	private addExtractedCriteria(extractedCriteria: string[]): void {
		this.checkPageBreak(30);
		this.addSectionTitle('CRITERIS IDENTIFICATS');

		this.doc.setFontSize(9);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'normal');

		extractedCriteria.forEach((criterion) => {
			this.checkPageBreak(8);
			this.doc.text(`• ${criterion}`, this.margin + 5, this.currentY);
			this.currentY += 5;
		});

		this.currentY += 10;
	}

	private addExecutiveSummary(summary: string): void {
		this.checkPageBreak(40);
		this.addSectionTitle('RESUM EXECUTIU');

		this.doc.setFontSize(10);
		this.doc.setTextColor(60, 60, 60);
		this.doc.setFont('helvetica', 'normal');
		const summaryHeight = this.addWrappedText(
			summary,
			this.margin,
			this.currentY,
			this.contentWidth,
		);
		this.currentY += summaryHeight + 15;
	}

	private addDetailedEvaluation(criteria: any[]): void {
		this.checkPageBreak(30);
		this.addSectionTitle('AVALUACIÓ DETALLADA PER CRITERIS');
		this.currentY += 5;

		criteria.forEach((criterion, index) => {
			this.checkPageBreak(80);
			this.addCriterionEvaluation(criterion, index + 1);
		});
	}

	private addCriterionEvaluation(criterion: any, index: number): void {
		this.doc.setFontSize(12);
		this.doc.setTextColor(25, 152, 117);
		this.doc.setFont('helvetica', 'bold');
		const criterionTitle = `${index}. ${criterion.criterion}`;
		const titleHeight = this.addWrappedText(
			criterionTitle,
			this.margin,
			this.currentY,
			this.contentWidth - 70,
		);

		const scoreColors = {
			COMPLEIX_EXITOSAMENT: [25, 152, 117],
			REGULAR: [245, 158, 11],
			INSUFICIENT: [220, 38, 38],
		};

		const scoreTexts = {
			COMPLEIX_EXITOSAMENT: 'Compleix exitosament',
			REGULAR: 'Regular',
			INSUFICIENT: 'Insuficient',
		};

		this.doc.setFontSize(10);
		const [r, g, b] = scoreColors[criterion.score as keyof typeof scoreColors];
		this.doc.setTextColor(r, g, b);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text(
			`Puntuació: ${scoreTexts[criterion.score as keyof typeof scoreTexts]}`,
			this.pageWidth - this.margin,
			this.currentY + 5,
			{ align: 'right' },
		);

		this.currentY += titleHeight + 10;

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
			this.doc.text('Punts Forts (Pros):', this.margin, this.currentY);
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
			this.doc.text('Àrees de Millora (Contras):', this.margin, this.currentY);
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
			this.checkPageBreak(15);

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

	private addFinalRecommendation(recommendation: string): void {
		this.checkPageBreak(25);
		this.addSectionTitle('RECOMANACIÓ FINAL');

		this.doc.setFillColor(255, 243, 205);
		this.doc.rect(this.margin, this.currentY - 2.5, this.contentWidth, 30, 'F');

		this.doc.setFontSize(10);
		this.doc.setTextColor(133, 100, 4);
		this.doc.setFont('helvetica', 'normal');
		this.addWrappedText(
			recommendation,
			this.margin + 5,
			this.currentY + 5,
			this.contentWidth - 10,
		);
	}
}

export const pdfGenerator = new PDFGeneratorService();
