'use client';

import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Header from './Header';
import BasicInfoForm from './BasicInfoForm';
import FileUploadSection from './FileUploadSection';
import ProposalUploadSection from './ProposalUploadSection';
import EvaluationControl from './EvaluationControl';
import LotEvaluationButtons from './LotEvaluationButtons';
import IndividualLotResults from './IndividualLotResults';
import EvaluationResults from './EvaluationResults';
import ProgressiveEvaluationLoader from './ProgressiveEvaluationLoader';
import SingleLotEvaluationLoader from './SingleLotEvaluationLoader';
import ComparisonLoader from './ComparisonLoader';
import Tooltip from './Tooltip';
import { apiService } from '@/lib/apiService';
import { PDFGeneratorService } from '@/lib/pdfGenerator';
import type {
	FileWithContent,
	EvaluationResult,
	BasicInfo,
	ProposalFile,
	LotInfo,
	ProposalComparison,
	LotEvaluation,
	FileContent,
} from '@/types';

interface EvaluationProgress {
	isEvaluating: boolean;
	currentLot: number;
	totalLots: number;
	currentLotTitle: string;
	completedEvaluations: LotEvaluation[];
}

interface LotEvaluationStatus {
	lotNumber: number;
	isEvaluated: boolean;
	isEvaluating: boolean;
	evaluations: LotEvaluation[];
	hasProposals: boolean;
	proposalCount: number;
}

interface IndividualLotEvaluation {
	lotNumber: number;
	lotTitle: string;
	evaluations: LotEvaluation[];
	timestamp: number;
}

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
	const [evaluationProgress, setEvaluationProgress] =
		useState<EvaluationProgress>({
			isEvaluating: false,
			currentLot: 0,
			totalLots: 0,
			currentLotTitle: '',
			completedEvaluations: [],
		});
	const [lotEvaluationStatuses, setLotEvaluationStatuses] = useState<
		Map<number, LotEvaluationStatus>
	>(new Map());
	const [individualLotResults, setIndividualLotResults] = useState<
		Map<number, IndividualLotEvaluation>
	>(new Map());
	const [currentEvaluatingLot, setCurrentEvaluatingLot] = useState<
		number | null
	>(null);
	const [evaluationResult, setEvaluationResult] =
		useState<EvaluationResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [isComparingProposals, setIsComparingProposals] = useState(false);
	const [currentComparingLot, setCurrentComparingLot] =
		useState<LotInfo | null>(null);

	const handleReset = () => {
		if (
			window.confirm(
				'Estàs segur que vols resetar tota la informació? Aquesta acció no es pot desfer.',
			)
		) {
			window.location.reload();
		}
	};

	useEffect(() => {
		const newStatuses = new Map<number, LotEvaluationStatus>();

		extractedLots.forEach((lot) => {
			const lotProposals = getProposalsForLot(lot.lotNumber);
			const proposalCount = getUniqueProposalCount(lotProposals);
			const existingStatus = lotEvaluationStatuses.get(lot.lotNumber);

			newStatuses.set(lot.lotNumber, {
				lotNumber: lot.lotNumber,
				isEvaluated: existingStatus?.isEvaluated || false,
				isEvaluating: existingStatus?.isEvaluating || false,
				evaluations: existingStatus?.evaluations || [],
				hasProposals: proposalCount > 0,
				proposalCount,
			});
		});

		setLotEvaluationStatuses(newStatuses);
	}, [extractedLots, proposalFiles]);

	useEffect(() => {
		const extractLots = async () => {
			if (specificationFiles.length === 0) {
				setExtractedLots([]);
				setProposalFiles([]);
				return;
			}

			try {
				setIsLoadingLots(true);

				const specifications: FileContent[] = specificationFiles.map(
					(file) => ({
						name: file.name,
						content: file.content,
						type: 'specification' as const,
					}),
				);

				const lots = await apiService.extractLots(specifications);

				if (lots.length > 0) {
					setExtractedLots(lots);
				} else {
					setExtractedLots([{ lotNumber: 1, title: 'Lot Únic' }]);
				}

				setProposalFiles([]);
				setLotEvaluationStatuses(new Map());
				setIndividualLotResults(new Map());
				setEvaluationResult(null);
			} catch (err) {
				console.error('Error extracting lots:', err);
				setExtractedLots([{ lotNumber: 1, title: 'Lot Únic' }]);
				setProposalFiles([]);
			} finally {
				setIsLoadingLots(false);
			}
		};

		extractLots();
	}, [specificationFiles]);

	const handleStartComparison = (lotInfo: LotInfo) => {
		console.log('🔄 Starting comparison for lot:', lotInfo);
		setIsComparingProposals(true);
		setCurrentComparingLot(lotInfo);
		setError(null);
	};

	const handleComparisonComplete = (comparison: ProposalComparison) => {
		console.log('✅ Comparison completed:', comparison);
		setIsComparingProposals(false);
		setCurrentComparingLot(null);
	};

	const handleComparisonError = (errorMessage: string) => {
		console.error('❌ Comparison error:', errorMessage);
		setIsComparingProposals(false);
		setCurrentComparingLot(null);
		setError(errorMessage);
	};

	const getProposalsForLot = (lotNumber: number): ProposalFile[] => {
		return proposalFiles.filter((file) => file.lotNumber === lotNumber);
	};

	const getUniqueProposalCount = (lotProposals: ProposalFile[]): number => {
		const groupedByName = new Map<string, ProposalFile[]>();
		lotProposals.forEach((file) => {
			const baseName = file.name.replace(/\s*\(.*?\)\s*/g, '').trim();
			if (!groupedByName.has(baseName)) {
				groupedByName.set(baseName, []);
			}
			groupedByName.get(baseName)!.push(file);
		});
		return groupedByName.size;
	};

	const getTotalProposals = () => {
		const groupedByName = new Map<string, ProposalFile[]>();

		proposalFiles.forEach((file) => {
			const baseName = file.name.replace(/\s*\(.*?\)\s*/g, '').trim();
			if (!groupedByName.has(baseName)) {
				groupedByName.set(baseName, []);
			}
			groupedByName.get(baseName)!.push(file);
		});

		return groupedByName.size;
	};

	const getLotsWithProposals = (): LotInfo[] => {
		return extractedLots.filter((lot) => {
			const status = lotEvaluationStatuses.get(lot.lotNumber);
			return status?.hasProposals;
		});
	};

	const handleEvaluateSingleLot = async (lotInfo: LotInfo) => {
		if (
			!basicInfo.title ||
			!basicInfo.expedient ||
			specificationFiles.length === 0
		) {
			setError('Si us plau, completa tots els camps obligatoris');
			return;
		}

		const lotProposals = getProposalsForLot(lotInfo.lotNumber);
		if (lotProposals.length === 0) {
			setError(`No hi ha propostes per al lot ${lotInfo.lotNumber}`);
			return;
		}

		setError(null);
		setCurrentEvaluatingLot(lotInfo.lotNumber);

		setLotEvaluationStatuses((prev) => {
			const newStatuses = new Map(prev);
			const status = newStatuses.get(lotInfo.lotNumber);
			if (status) {
				newStatuses.set(lotInfo.lotNumber, {
					...status,
					isEvaluating: true,
				});
			}
			return newStatuses;
		});

		try {
			const specifications: FileContent[] = specificationFiles.map((file) => ({
				name: file.name,
				content: file.content,
				type: 'specification' as const,
			}));

			const proposals: FileContent[] = lotProposals.map((file) => ({
				name: file.name,
				content: file.content,
				type: 'proposal' as const,
				lotNumber: file.lotNumber,
			}));

			console.log(`🚀 Starting evaluation for lot ${lotInfo.lotNumber}...`);
			const result = await apiService.evaluateSingleLot(
				specifications,
				proposals,
				lotInfo,
			);

			const lotEvaluations = result.evaluations.map(
				(lot): LotEvaluation => ({
					...lot,
					companyName: lot.companyName || null,
				}),
			);

			console.log(
				`✅ Evaluation completed for lot ${lotInfo.lotNumber}:`,
				lotEvaluations,
			);

			setLotEvaluationStatuses((prev) => {
				const newStatuses = new Map(prev);
				const status = newStatuses.get(lotInfo.lotNumber);
				if (status) {
					newStatuses.set(lotInfo.lotNumber, {
						...status,
						isEvaluating: false,
						isEvaluated: true,
						evaluations: lotEvaluations,
					});
				}
				return newStatuses;
			});

			setIndividualLotResults((prev) => {
				const newResults = new Map(prev);
				newResults.set(lotInfo.lotNumber, {
					lotNumber: lotInfo.lotNumber,
					lotTitle: lotInfo.title,
					evaluations: lotEvaluations,
					timestamp: Date.now(),
				});
				return newResults;
			});

			console.log(
				`📊 Individual lot result added for lot ${lotInfo.lotNumber}`,
			);
		} catch (err) {
			console.error(`❌ Error evaluating lot ${lotInfo.lotNumber}:`, err);
			setError(
				`Error avaluant lot ${lotInfo.lotNumber}: ${
					err instanceof Error ? err.message : 'Error desconegut'
				}`,
			);

			setLotEvaluationStatuses((prev) => {
				const newStatuses = new Map(prev);
				const status = newStatuses.get(lotInfo.lotNumber);
				if (status) {
					newStatuses.set(lotInfo.lotNumber, {
						...status,
						isEvaluating: false,
					});
				}
				return newStatuses;
			});
		} finally {
			setCurrentEvaluatingLot(null);
		}
	};

	const handleEvaluateAllLots = async () => {
		if (
			!basicInfo.title ||
			!basicInfo.expedient ||
			specificationFiles.length === 0 ||
			proposalFiles.length === 0
		) {
			setError('Si us plau, completa tots els camps obligatoris');
			return;
		}

		const lotsWithProposals = getLotsWithProposals();

		if (lotsWithProposals.length === 0) {
			setError('No hi ha propostes per evaluar en cap lot');
			return;
		}

		setError(null);
		setEvaluationResult(null);
		setIndividualLotResults(new Map());
		setEvaluationProgress({
			isEvaluating: true,
			currentLot: 0,
			totalLots: lotsWithProposals.length,
			currentLotTitle: '',
			completedEvaluations: [],
		});

		try {
			const specifications: FileContent[] = specificationFiles.map((file) => ({
				name: file.name,
				content: file.content,
				type: 'specification' as const,
			}));

			const allEvaluations: LotEvaluation[] = [];

			for (let i = 0; i < lotsWithProposals.length; i++) {
				const lot = lotsWithProposals[i];

				setEvaluationProgress((prev) => ({
					...prev,
					currentLot: i + 1,
					currentLotTitle: lot.title,
				}));

				const lotProposals = getProposalsForLot(lot.lotNumber);
				const proposals: FileContent[] = lotProposals.map((file) => ({
					name: file.name,
					content: file.content,
					type: 'proposal' as const,
					lotNumber: file.lotNumber,
				}));

				const lotResult = await apiService.evaluateSingleLot(
					specifications,
					proposals,
					lot,
				);

				const lotEvaluations = lotResult.evaluations.map(
					(lot): LotEvaluation => ({
						...lot,
						companyName: lot.companyName || null,
					}),
				);

				allEvaluations.push(...lotEvaluations);

				setLotEvaluationStatuses((prev) => {
					const newStatuses = new Map(prev);
					const status = newStatuses.get(lot.lotNumber);
					if (status) {
						newStatuses.set(lot.lotNumber, {
							...status,
							isEvaluated: true,
							evaluations: lotEvaluations,
						});
					}
					return newStatuses;
				});
			}

			const finalResult: EvaluationResult = {
				lots: allEvaluations,
				extractedLots: extractedLots,
				overallSummary: generateOverallSummary(
					allEvaluations,
					lotsWithProposals,
					extractedLots.length,
				),
				overallRecommendation: generateOverallRecommendation(
					allEvaluations,
					lotsWithProposals,
					extractedLots.length,
				),
				completedLots: lotsWithProposals.length,
				totalLots: extractedLots.length,
				isComplete: true,
			};

			setEvaluationResult(finalResult);
		} catch (err) {
			setError(
				`Error durant l'avaluació: ${
					err instanceof Error ? err.message : 'Error desconegut'
				}`,
			);
		} finally {
			setEvaluationProgress((prev) => ({
				...prev,
				isEvaluating: false,
			}));
		}
	};

	const generateOverallSummary = (
		evaluations: LotEvaluation[],
		evaluatedLots: LotInfo[],
		totalLots: number,
	): string => {
		const totalProposals = evaluations.filter((e) => e.hasProposal).length;
		const companiesIdentified = evaluations.filter(
			(e) => e.companyName !== null,
		).length;
		const lotsWithoutProposals = totalLots - evaluatedLots.length;

		let summary = `S'han avaluat ${totalProposals} propostes distribuïdes en ${evaluatedLots.length} lots. `;
		summary += `S'han identificat automàticament ${companiesIdentified} empreses de ${totalProposals} propostes presentades. `;

		if (lotsWithoutProposals > 0) {
			summary += `${lotsWithoutProposals} lot${
				lotsWithoutProposals > 1 ? 's' : ''
			} no ${lotsWithoutProposals > 1 ? 'han rebut' : 'ha rebut'} propostes. `;
		}

		summary += `L'avaluació ha estat completada amb èxit utilitzant criteris específics per cada lot.`;

		return summary;
	};

	const generateOverallRecommendation = (
		evaluations: LotEvaluation[],
		evaluatedLots: LotInfo[],
		totalLots: number,
	): string => {
		const hasMultipleLots = totalLots > 1;
		const lotsWithoutProposals = totalLots - evaluatedLots.length;

		let recommendation = `Es recomana revisar ${
			hasMultipleLots
				? 'individualment cada lot i les seves respectives avaluacions'
				: "detingudament l'avaluació realitzada"
		}. `;

		if (lotsWithoutProposals > 0) {
			recommendation += `Cal considerar si relicitar ${
				lotsWithoutProposals > 1
					? 'els lots que no han rebut propostes'
					: 'el lot que no ha rebut propostes'
			} o revisar els requisits per facilitar la participació. `;
		}

		recommendation += `Cada lot avaluat ha utilitzat criteris específics i requereix una anàlisi detallada per prendre decisions informades sobre l'adjudicació.`;

		return recommendation;
	};

	const generatePDF = (specificEvaluation?: LotEvaluation) => {
		console.log('📄 Generating PDF report...', {
			evaluationResult,
			specificEvaluation,
			individualLotResults: individualLotResults.size,
		});

		const pdfGenerator = new PDFGeneratorService();

		if (specificEvaluation) {
			// Para informes individuales, crear un EvaluationResult temporal
			const tempEvaluationResult: EvaluationResult = {
				lots: [specificEvaluation],
				extractedLots: [
					{
						lotNumber: specificEvaluation.lotNumber,
						title: specificEvaluation.lotTitle,
					},
				],
				overallSummary: '',
				overallRecommendation: '',
				completedLots: 1,
				totalLots: 1,
				isComplete: true,
			};

			pdfGenerator.generateEvaluationReport(
				tempEvaluationResult,
				basicInfo,
				specificEvaluation,
			);
		} else if (evaluationResult) {
			// Para informes completos
			pdfGenerator.generateEvaluationReport(
				evaluationResult,
				basicInfo,
				specificEvaluation,
			);
		} else {
			console.error('No evaluation data available for PDF generation');
			return;
		}
	};

	const generateComparisonPDF = (comparison: ProposalComparison) => {
		const pdfGenerator = new PDFGeneratorService();
		pdfGenerator.generateComparisonReport(comparison, basicInfo);
	};

	const shouldShowProposalSection =
		specificationFiles.length > 0 && extractedLots.length > 0 && !isLoadingLots;

	const isProcessing = isLoadingLots;
	const totalProposals = getTotalProposals();
	const lotsWithProposals = getLotsWithProposals();
	const hasIndividualResults = individualLotResults.size > 0;
	const isAnyLotEvaluating = currentEvaluatingLot !== null;

	const specifications: FileContent[] = specificationFiles.map((file) => ({
		name: file.name,
		content: file.content,
		type: 'specification' as const,
	}));

	return (
		<div
			className="min-h-screen"
			style={{
				background: 'linear-gradient(135deg, #dfe7e6 0%, #ffffff 100%)',
			}}
		>
			<Header onReset={handleReset} />

			<ProgressiveEvaluationLoader
				isVisible={evaluationProgress.isEvaluating}
				currentLot={evaluationProgress.currentLot}
				totalLots={evaluationProgress.totalLots}
				currentLotTitle={evaluationProgress.currentLotTitle}
			/>

			<SingleLotEvaluationLoader
				isVisible={isAnyLotEvaluating}
				lotNumber={currentEvaluatingLot || 0}
				lotTitle={
					extractedLots.find((lot) => lot.lotNumber === currentEvaluatingLot)
						?.title || ''
				}
			/>

			<ComparisonLoader
				isVisible={isComparingProposals}
				lotNumber={currentComparingLot?.lotNumber || 0}
				lotTitle={currentComparingLot?.title || ''}
				proposalCount={
					currentComparingLot
						? getProposalsForLot(currentComparingLot.lotNumber).length
						: 0
				}
			/>

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
															{extractedLots.map((lot, index) => {
																const status = lotEvaluationStatuses.get(
																	lot.lotNumber,
																);
																return (
																	<div
																		key={lot.lotNumber}
																		className="flex items-start space-x-2 text-xs text-gray-700 animate-slide-in-up"
																		style={{
																			animationDelay: `${index * 150}ms`,
																			animationFillMode: 'both',
																		}}
																	>
																		<span
																			className={`w-5 h-5 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
																				status?.isEvaluated
																					? 'bg-green-500'
																					: status?.hasProposals
																					? 'bg-gradient-to-r from-green-400 to-blue-500'
																					: 'bg-gray-400'
																			}`}
																		>
																			{lot.lotNumber}
																		</span>
																		<div className="flex-1">
																			<span className="font-medium leading-relaxed">
																				{lot.title}
																			</span>
																			{status && (
																				<div className="text-[10px] mt-1 space-x-2">
																					{status.isEvaluated && (
																						<span className="text-green-600 font-medium">
																							✓ Avaluat
																						</span>
																					)}
																					{status.hasProposals ? (
																						<span className="text-blue-600">
																							{status.proposalCount} propost
																							{status.proposalCount > 1
																								? 'es'
																								: 'a'}
																						</span>
																					) : (
																						<span className="text-orange-600">
																							Sense propostes
																						</span>
																					)}
																				</div>
																			)}
																		</div>
																	</div>
																);
															})}
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

						<div
							className="border-t px-6 py-4"
							style={{ borderColor: '#dfe7e6', backgroundColor: '#dfe7e6' }}
						>
							<EvaluationControl
								onEvaluateAll={handleEvaluateAllLots}
								isEvaluating={evaluationProgress.isEvaluating}
								isProcessing={isProcessing}
								error={error}
								totalProposals={totalProposals}
								lotsWithProposals={lotsWithProposals.length}
								totalLots={extractedLots.length}
							/>

							{shouldShowProposalSection &&
								lotsWithProposals.length > 0 &&
								!evaluationProgress.isEvaluating && (
									<LotEvaluationButtons
										lots={extractedLots}
										lotStatuses={lotEvaluationStatuses}
										onEvaluateLot={handleEvaluateSingleLot}
										isFormValid={
											!!(
												basicInfo.title &&
												basicInfo.expedient &&
												specificationFiles.length > 0
											)
										}
										currentEvaluatingLot={currentEvaluatingLot}
									/>
								)}
						</div>

						{hasIndividualResults && !evaluationResult && (
							<IndividualLotResults
								lotResults={individualLotResults}
								specifications={specifications}
								onDownloadPDF={generatePDF}
								onDownloadComparisonPDF={generateComparisonPDF}
								isComparing={isComparingProposals}
								onStartComparison={handleStartComparison}
								onComparisonComplete={handleComparisonComplete}
								onComparisonError={handleComparisonError}
							/>
						)}

						{evaluationResult && (
							<EvaluationResults
								evaluationResult={evaluationResult}
								specifications={specifications}
								onDownloadPDF={generatePDF}
								onDownloadComparisonPDF={generateComparisonPDF}
								isComparing={isComparingProposals}
								onStartComparison={handleStartComparison}
								onComparisonComplete={handleComparisonComplete}
								onComparisonError={handleComparisonError}
							/>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
