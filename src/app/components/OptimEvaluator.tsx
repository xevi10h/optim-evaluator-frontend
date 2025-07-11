'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import Header from './Header';
import BasicInfoForm from './BasicInfoForm';
import FileUploadSection from './FileUploadSection';
import EvaluationControl from './EvaluationControl';
import EvaluationResults from './EvaluationResults';
import { apiService } from '@/lib/apiService';
import { PDFGeneratorService } from '@/lib/pdfGenerator';
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

		const pdfGenerator = new PDFGeneratorService();
		pdfGenerator.generateEvaluationReport(evaluationResult, basicInfo);
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
