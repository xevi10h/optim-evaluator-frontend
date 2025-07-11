'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import Header from './Header';
import BasicInfoForm from './BasicInfoForm';
import FileUploadSection from './FileUploadSection';
import EvaluationControl from './EvaluationControl';
import EvaluationResults from './EvaluationResults';
import type {
	FileWithContent,
	EvaluationResult,
	BasicInfo,
	FileContent,
} from '@/types';

export default function OptimEvaluator() {
	const [basicInfo, setBasicInfo] = useState<BasicInfo>({
		title: '',
		expedient: '',
		entity: '',
		context: '',
	});

	const [specificationFiles, setSpecificationFiles] = useState<
		FileWithContent[]
	>([]);
	const [proposalFiles, setProposalFiles] = useState<FileWithContent[]>([]);
	const [isEvaluating, setIsEvaluating] = useState(false);
	const [evaluationResult, setEvaluationResult] =
		useState<EvaluationResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [evaluationStatus, setEvaluationStatus] = useState<string>('');

	const evaluateWithAPI = async (): Promise<EvaluationResult> => {
		const specifications: FileContent[] = specificationFiles.map((file) => ({
			name: file.name,
			content: file.content,
			type: 'specification' as const,
		}));

		const proposals: FileContent[] = proposalFiles.map((file) => ({
			name: file.name,
			content: file.content,
			type: 'proposal' as const,
		}));

		setEvaluationStatus('Connectant amb el sistema...');

		const response = await fetch('/api/evaluate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				specifications,
				proposals,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Error en l'avaluació");
		}

		const result = await response.json();
		return result;
	};

	const generatePDF = () => {
		if (!evaluationResult) return;

		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 20;

		doc.setFont('helvetica');

		doc.setFontSize(24);
		doc.setTextColor(25, 152, 117);
		doc.text("INFORME D'AVALUACIÓ", pageWidth / 2, 40, { align: 'center' });
		doc.text('DE PROPOSTA DE LICITACIÓ', pageWidth / 2, 55, {
			align: 'center',
		});

		doc.setFontSize(12);
		doc.setTextColor(60, 60, 60);
		doc.text(`Títol: ${basicInfo.title}`, margin, 80);
		doc.text(`Expedient: ${basicInfo.expedient}`, margin, 95);
		doc.text(`Entitat: ${basicInfo.entity}`, margin, 110);
		doc.text(`Data: ${new Date().toLocaleDateString('ca-ES')}`, margin, 125);
		doc.text(
			`Confiança de l'avaluació: ${Math.round(
				evaluationResult.confidence * 100,
			)}%`,
			margin,
			140,
		);

		doc.setFontSize(10);
		doc.setTextColor(100, 100, 100);
		doc.text('Criteris avaluats:', margin, 155);
		evaluationResult.extractedCriteria.forEach((criterion, index) => {
			if (index < 5) {
				doc.text(`• ${criterion}`, margin + 5, 165 + index * 5);
			}
		});

		doc.addPage();
		let yPosition = 30;

		doc.setFontSize(16);
		doc.setTextColor(25, 152, 117);
		doc.text('RESUM EXECUTIU', margin, yPosition);
		yPosition += 15;

		doc.setFontSize(10);
		doc.setTextColor(60, 60, 60);
		const splitSummary = doc.splitTextToSize(
			evaluationResult.summary,
			pageWidth - 2 * margin,
		);
		doc.text(splitSummary, margin, yPosition);
		yPosition += splitSummary.length * 5 + 20;

		doc.setFontSize(16);
		doc.setTextColor(25, 152, 117);
		doc.text('AVALUACIÓ DETALLADA', margin, yPosition);
		yPosition += 15;

		evaluationResult.criteria.forEach((criterion, index) => {
			if (yPosition > pageHeight - 80) {
				doc.addPage();
				yPosition = 30;
			}

			doc.setFontSize(12);
			doc.setTextColor(60, 60, 60);
			doc.text(`${index + 1}. ${criterion.criterion}`, margin, yPosition);
			yPosition += 10;

			const scoreText =
				criterion.score === 'COMPLEIX_EXITOSAMENT'
					? '🟢 COMPLEIX EXITOSAMENT'
					: criterion.score === 'REGULAR'
					? '🟡 REGULAR'
					: '🔴 INSUFICIENT';

			doc.setFontSize(10);
			doc.setTextColor(
				criterion.score === 'COMPLEIX_EXITOSAMENT'
					? 25
					: criterion.score === 'REGULAR'
					? 245
					: 220,
				criterion.score === 'COMPLEIX_EXITOSAMENT'
					? 152
					: criterion.score === 'REGULAR'
					? 158
					: 38,
				criterion.score === 'COMPLEIX_EXITOSAMENT'
					? 117
					: criterion.score === 'REGULAR'
					? 11
					: 38,
			);
			doc.text(scoreText, margin + 10, yPosition);
			yPosition += 10;

			doc.setTextColor(60, 60, 60);
			const splitJustification = doc.splitTextToSize(
				criterion.justification,
				pageWidth - 2 * margin - 20,
			);
			doc.text(splitJustification, margin + 10, yPosition);
			yPosition += splitJustification.length * 4 + 8;

			if (criterion.strengths.length > 0) {
				doc.setTextColor(25, 152, 117);
				doc.text('Punts forts:', margin + 10, yPosition);
				yPosition += 5;
				doc.setTextColor(60, 60, 60);
				criterion.strengths.forEach((strength) => {
					doc.text(`• ${strength}`, margin + 15, yPosition);
					yPosition += 4;
				});
				yPosition += 3;
			}

			if (criterion.improvements.length > 0) {
				doc.setTextColor(220, 38, 38);
				doc.text('Àrees de millora:', margin + 10, yPosition);
				yPosition += 5;
				doc.setTextColor(60, 60, 60);
				criterion.improvements.forEach((improvement) => {
					doc.text(`• ${improvement}`, margin + 15, yPosition);
					yPosition += 4;
				});
				yPosition += 8;
			}
		});

		if (yPosition > pageHeight - 60) {
			doc.addPage();
			yPosition = 30;
		}

		doc.setFontSize(16);
		doc.setTextColor(25, 152, 117);
		doc.text('RECOMANACIÓ FINAL', margin, yPosition);
		yPosition += 15;

		doc.setFontSize(10);
		doc.setTextColor(60, 60, 60);
		const splitRecommendation = doc.splitTextToSize(
			evaluationResult.recommendation,
			pageWidth - 2 * margin,
		);
		doc.text(splitRecommendation, margin, yPosition);

		yPosition += splitRecommendation.length * 4 + 20;
		doc.setFontSize(8);
		doc.setTextColor(120, 120, 120);
		doc.text(
			"Generat per OptimEvaluator - Sistema d'Avaluació Automàtica",
			margin,
			yPosition,
		);
		doc.text(
			`Data de generació: ${new Date().toLocaleString('ca-ES')}`,
			margin,
			yPosition + 10,
		);
		doc.text(`Versió del sistema: v1.0`, margin, yPosition + 20);

		doc.save(
			`avaluacio_${basicInfo.expedient}_${
				new Date().toISOString().split('T')[0]
			}.pdf`,
		);
	};

	const handleEvaluate = async () => {
		if (
			!basicInfo.title ||
			!basicInfo.expedient ||
			specificationFiles.length === 0 ||
			proposalFiles.length === 0
		) {
			setError('Si us plau, completa tots els camps obligatoris');
			return;
		}

		setIsEvaluating(true);
		setError(null);
		setEvaluationResult(null);

		try {
			setEvaluationStatus("Extraient criteris d'avaluació...");
			const result = await evaluateWithAPI();
			setEvaluationResult(result);
			setEvaluationStatus('');
		} catch (err) {
			setError(
				`Error durant l'avaluació: ${
					err instanceof Error ? err.message : 'Error desconegut'
				}`,
			);
			setEvaluationStatus('');
		} finally {
			setIsEvaluating(false);
		}
	};

	const isProcessing = false;

	return (
		<div
			className="min-h-screen"
			style={{
				background: 'linear-gradient(135deg, #dfe7e6 0%, #ffffff 100%)',
			}}
		>
			<Header />

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="space-y-6">
					<BasicInfoForm basicInfo={basicInfo} setBasicInfo={setBasicInfo} />

					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="border-t" style={{ borderColor: '#dfe7e6' }}>
							<div className="px-6 py-4" style={{ backgroundColor: '#dfe7e6' }}>
								<h3
									className="text-lg font-semibold flex items-center"
									style={{ color: '#1c1c1c' }}
								>
									<Upload className="mr-2 h-5 w-5" />
									Documents de la Licitació
								</h3>
							</div>

							<div className="p-6">
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
									<FileUploadSection
										title="Plec de Condicions *"
										description="PDF, DOC, DOCX - Màxim 10MB"
										files={specificationFiles}
										setFiles={setSpecificationFiles}
										icon="spec"
									/>

									<FileUploadSection
										title="Proposta a Avaluar *"
										description="PDF, DOC, DOCX - Màxim 10MB"
										files={proposalFiles}
										setFiles={setProposalFiles}
										icon="proposal"
									/>
								</div>
							</div>
						</div>

						<EvaluationControl
							onEvaluate={handleEvaluate}
							isEvaluating={isEvaluating}
							isProcessing={isProcessing}
							error={error}
							evaluationStatus={evaluationStatus}
						/>

						{evaluationResult && (
							<EvaluationResults
								evaluationResult={evaluationResult}
								onDownloadPDF={generatePDF}
							/>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
