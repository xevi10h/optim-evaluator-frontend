// src/app/components/OptimEvaluator.tsx - VERSIÓN LIMPIA
'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import Header from './Header';
import BasicInfoForm from './BasicInfoForm';
import FileUploadSection from './FileUploadSection';
import EvaluationControl from './EvaluationControl';
import EvaluationResults from './EvaluationResults';
import { apiService } from '@/lib/apiService';
import type { FileWithContent, EvaluationResult, BasicInfo } from '@/types';

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
			setEvaluationStatus('Connectant amb el servidor...');

			// Convertir archivos al formato esperado por el backend
			const specifications = specificationFiles.map((file) => ({
				name: file.name,
				content: file.content,
				type: 'specification' as const,
			}));

			const proposals = proposalFiles.map((file) => ({
				name: file.name,
				content: file.content,
				type: 'proposal' as const,
			}));

			setEvaluationStatus("Extraient criteris d'avaluació...");
			const result = await apiService.evaluateProposal(
				specifications,
				proposals,
			);

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

	const generatePDF = () => {
		if (!evaluationResult) return;

		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 20;

		doc.setFont('helvetica');

		// Header
		doc.setFontSize(24);
		doc.setTextColor(25, 152, 117);
		doc.text("INFORME D'AVALUACIÓ", pageWidth / 2, 40, { align: 'center' });
		doc.text('DE PROPOSTA DE LICITACIÓ', pageWidth / 2, 55, {
			align: 'center',
		});

		// Info básica
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

		// Continuar con el resto del PDF como antes...
		// [El resto del código del PDF permanece igual]

		doc.save(
			`avaluacio_${basicInfo.expedient}_${
				new Date().toISOString().split('T')[0]
			}.pdf`,
		);
	};

	const isProcessing = false; // Ya no hay procesamiento local

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
