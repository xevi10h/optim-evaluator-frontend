'use client';

import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Header from './Header';
import BasicInfoForm from './BasicInfoForm';
import FileUploadSection from './FileUploadSection';
import ProposalUploadSection from './ProposalUploadSection';
import EvaluationControl from './EvaluationControl';
import EvaluationResults from './EvaluationResults';
import Tooltip from './Tooltip';
import { apiService } from '@/lib/apiService';
import { PDFGeneratorService } from '@/lib/pdfGenerator';
import type {
	FileWithContent,
	EvaluationResult,
	BasicInfo,
	ProposalFile,
	LotInfo,
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
	const [proposalFiles, setProposalFiles] = useState<ProposalFile[]>([]);
	const [extractedLots, setExtractedLots] = useState<LotInfo[]>([]);
	const [isLoadingLots, setIsLoadingLots] = useState(false);
	const [isEvaluating, setIsEvaluating] = useState(false);
	const [evaluationResult, setEvaluationResult] =
		useState<EvaluationResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [evaluationStatus, setEvaluationStatus] = useState<string>('');

	useEffect(() => {
		const extractLots = async () => {
			if (specificationFiles.length === 0) {
				setExtractedLots([]);
				setProposalFiles([]);
				return;
			}

			try {
				setIsLoadingLots(true);
				setEvaluationStatus('Extraient informació dels lots...');

				const specifications = specificationFiles.map((file) => ({
					name: file.name,
					content: file.content,
					type: 'specification' as const,
				}));

				const lots = await apiService.extractLots(specifications);

				if (lots.length > 0) {
					setExtractedLots(lots);
				} else {
					setExtractedLots([{ lotNumber: 1, title: 'Lot Únic' }]);
				}

				setProposalFiles([]);
				setEvaluationStatus('');
			} catch (err) {
				console.error('Error extracting lots:', err);
				setExtractedLots([{ lotNumber: 1, title: 'Lot Únic' }]);
				setProposalFiles([]);
				setEvaluationStatus('');
			} finally {
				setIsLoadingLots(false);
			}
		};

		extractLots();
	}, [specificationFiles]);

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
				lotNumber: file.lotNumber,
			}));

			setEvaluationStatus('Avaluant propostes per lots...');
			const result = await apiService.evaluateProposalWithLots(
				specifications,
				proposals,
				extractedLots,
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

	const shouldShowProposalSection =
		specificationFiles.length > 0 && extractedLots.length > 0 && !isLoadingLots;

	const isProcessing = isLoadingLots;

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
								<div className="space-y-8">
									<div className="transition-all duration-500 ease-in-out">
										<div className="flex items-center mb-4">
											<h4
												className="text-md font-medium"
												style={{ color: '#1c1c1c' }}
											>
												Plecs de Condicions *
											</h4>
											<Tooltip
												content="Aquí s'han d'afegir els Plecs Tècnics, els Plecs Administratius o un sol document que els agrupi els dos."
												position="top"
											>
												<div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold ml-2 cursor-help">
													i
												</div>
											</Tooltip>
										</div>
										<FileUploadSection
											title=""
											description="PDF, DOC, DOCX - Màxim 10MB"
											files={specificationFiles}
											setFiles={setSpecificationFiles}
											icon="spec"
										/>
									</div>

									{shouldShowProposalSection && (
										<div className="animate-slide-in-up opacity-0 animate-fade-in">
											<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-1 mb-4 animate-pulse-border">
												<div className="bg-white rounded-lg p-4">
													<div className="flex items-center mb-4 animate-bounce-in">
														<div className="flex items-center space-x-2">
															<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
															<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
															<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-200"></div>
														</div>
														<span className="ml-3 text-sm font-medium text-green-700">
															{extractedLots.length > 1
																? `${extractedLots.length} lots identificats`
																: '1 lot identificat'}
														</span>
													</div>

													{extractedLots.length > 1 && (
														<div className="mb-4 space-y-2">
															<p className="text-xs font-medium text-gray-600 mb-2">
																Lots Disponibles:
															</p>
															{extractedLots.map((lot, index) => (
																<div
																	key={lot.lotNumber}
																	className="flex items-start space-x-2 text-xs text-gray-700 animate-slide-in-up"
																	style={{
																		animationDelay: `${index * 150}ms`,
																		animationFillMode: 'both',
																	}}
																>
																	<span className="w-5 h-5 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
																		{lot.lotNumber}
																	</span>
																	<span className="font-medium leading-relaxed">
																		{lot.title}
																	</span>
																</div>
															))}
														</div>
													)}
												</div>
											</div>

											<ProposalUploadSection
												extractedLots={extractedLots}
												proposalFiles={proposalFiles}
												setProposalFiles={setProposalFiles}
											/>
										</div>
									)}
								</div>

								{specificationFiles.length > 0 &&
									!shouldShowProposalSection && (
										<div
											className="mt-6 p-4 rounded-lg border"
											style={{
												backgroundColor: '#f3f4f6',
												borderColor: '#949494',
												borderStyle: 'dashed',
											}}
										>
											<div className="text-center">
												<div className="flex items-center justify-center mb-2">
													{isLoadingLots ? (
														<div
															className="animate-spin rounded-full h-6 w-6 border-b-2"
															style={{ borderColor: '#199875' }}
														></div>
													) : (
														<Upload
															className="h-6 w-6"
															style={{ color: '#949494' }}
														/>
													)}
												</div>
												<p
													className="text-sm font-medium"
													style={{ color: '#1c1c1c' }}
												>
													{isLoadingLots
														? 'Extraient informació dels lots del plec de condicions...'
														: 'Afegeix el Plec de Condicions per continuar'}
												</p>
												<p
													className="text-xs mt-1"
													style={{ color: '#6f6f6f' }}
												>
													{isLoadingLots
														? 'Això pot trigar uns segons...'
														: 'Un cop processat, podràs afegir les propostes per cada lot identificat.'}
												</p>
											</div>
										</div>
									)}
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
