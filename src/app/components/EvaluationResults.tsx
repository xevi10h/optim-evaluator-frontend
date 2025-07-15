'use client';

import React from 'react';
import {
	CheckCircle,
	Download,
	Package,
	FileText,
	Users,
	Target,
	TrendingUp,
	Building,
} from 'lucide-react';
import LotEvaluationComponent from './LotEvaluation';
import { getDisplayName, hasCompanyInfo } from '@/types';
import type {
	EvaluationResult,
	FileContent,
	ProposalComparison,
	LotEvaluation,
} from '@/types';

interface EvaluationResultsProps {
	evaluationResult: EvaluationResult;
	specifications: FileContent[];
	onDownloadPDF: (evaluation?: LotEvaluation) => void;
	onDownloadComparisonPDF: (comparison: ProposalComparison) => void;
}

export default function EvaluationResults({
	evaluationResult,
	specifications,
	onDownloadPDF,
	onDownloadComparisonPDF,
}: EvaluationResultsProps) {
	const hasMultipleLots = evaluationResult.extractedLots.length > 1;

	const groupEvaluationsByLot = () => {
		const grouped = new Map();

		evaluationResult.lots.forEach((evaluation) => {
			if (!grouped.has(evaluation.lotNumber)) {
				grouped.set(evaluation.lotNumber, []);
			}
			grouped.get(evaluation.lotNumber).push(evaluation);
		});

		return grouped;
	};

	const groupedEvaluations = groupEvaluationsByLot();

	const companiesIdentified = evaluationResult.lots.filter(
		(lot) => lot.hasProposal && hasCompanyInfo(lot),
	).length;

	const totalProposals = evaluationResult.lots.filter(
		(lot) => lot.hasProposal,
	).length;

	return (
		<div
			className="border-t animate-fade-in"
			style={{ borderColor: '#dfe7e6' }}
		>
			<div
				className="px-6 py-4 animate-slide-in-up"
				style={{
					background: 'linear-gradient(135deg, #199875 0%, #188869 100%)',
				}}
			>
				<h3 className="text-xl font-semibold text-white flex items-center">
					<CheckCircle className="mr-2 h-5 w-5 animate-bounce" />
					Resultat de l'Avaluació
				</h3>
				<p className="text-sm text-white opacity-90 mt-1">
					Avaluació completada amb èxit | Anàlisi detallada disponible
				</p>
			</div>

			<div className="p-6 space-y-8">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
					<div
						className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-l-4 hover:shadow-lg transition-shadow duration-300"
						style={{ borderLeftColor: '#3b82f6' }}
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-blue-700">
									Lots Avaluats
								</p>
								<p className="text-2xl font-bold text-blue-900">
									{evaluationResult.extractedLots.length}
								</p>
							</div>
							<div className="p-3 bg-blue-200 rounded-full">
								<Package className="h-6 w-6 text-blue-700" />
							</div>
						</div>
					</div>

					<div
						className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-l-4 hover:shadow-lg transition-shadow duration-300"
						style={{ borderLeftColor: '#199875' }}
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-green-700">
									Propostes Avaluades
								</p>
								<p className="text-2xl font-bold text-green-900">
									{totalProposals}
								</p>
							</div>
							<div className="p-3 bg-green-200 rounded-full">
								<FileText className="h-6 w-6 text-green-700" />
							</div>
						</div>
					</div>

					<div
						className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-l-4 hover:shadow-lg transition-shadow duration-300"
						style={{ borderLeftColor: '#8b5cf6' }}
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-purple-700">
									Empreses Identificades
								</p>
								<p className="text-2xl font-bold text-purple-900">
									{companiesIdentified}/{totalProposals}
								</p>
								<p className="text-xs text-purple-600 mt-1">
									{totalProposals > 0
										? `${Math.round(
												(companiesIdentified / totalProposals) * 100,
										  )}% identificades`
										: 'Sense propostes'}
								</p>
							</div>
							<div className="p-3 bg-purple-200 rounded-full">
								<Building className="h-6 w-6 text-purple-700" />
							</div>
						</div>
					</div>
				</div>

				{evaluationResult.overallSummary && (
					<div
						className="rounded-xl p-6 animate-fade-in shadow-sm"
						style={{
							backgroundColor: '#f8fafc',
							border: '1px solid #e2e8f0',
							animationDelay: '0.1s',
							animationFillMode: 'both',
						}}
					>
						<h4
							className="text-lg font-semibold mb-4 flex items-center"
							style={{ color: '#1c1c1c' }}
						>
							<div className="p-2 bg-blue-100 rounded-lg mr-3">
								<FileText className="h-5 w-5 text-blue-600" />
							</div>
							Resum General
						</h4>
						<p className="leading-relaxed text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
							{evaluationResult.overallSummary}
						</p>
					</div>
				)}

				<div className="space-y-8">
					{evaluationResult.extractedLots.map((lotInfo, index) => {
						const lotEvaluations =
							groupedEvaluations.get(lotInfo.lotNumber) || [];

						return (
							<div
								key={lotInfo.lotNumber}
								className="animate-slide-in-up"
								style={{
									animationDelay: `${(index + 1) * 0.2}s`,
									animationFillMode: 'both',
								}}
							>
								<LotEvaluationComponent
									lotInfo={lotInfo}
									evaluations={lotEvaluations}
									specifications={specifications}
									hasMultipleLots={hasMultipleLots}
									onDownloadComparisonPDF={onDownloadComparisonPDF}
								/>
							</div>
						);
					})}
				</div>

				{evaluationResult.overallRecommendation && (
					<div
						className="rounded-xl p-6 animate-fade-in shadow-sm"
						style={{
							backgroundColor: '#f0f9ff',
							border: '1px solid #bae6fd',
							animationDelay: '0.8s',
							animationFillMode: 'both',
						}}
					>
						<h4
							className="text-lg font-semibold mb-4 flex items-center"
							style={{ color: '#0369a1' }}
						>
							<div className="p-2 bg-blue-200 rounded-lg mr-3">
								<Users className="h-5 w-5 text-blue-700" />
							</div>
							Anàlisi General
						</h4>
						<div
							className="leading-relaxed bg-white p-4 rounded-lg border border-blue-200"
							style={{ color: '#0369a1' }}
						>
							{evaluationResult.overallRecommendation
								.split('\n')
								.map((paragraph, i) => (
									<p key={i} className={i > 0 ? 'mt-3' : ''}>
										{paragraph}
									</p>
								))}
						</div>
					</div>
				)}

				<div
					className="space-y-6 animate-fade-in"
					style={{ animationDelay: '1s', animationFillMode: 'both' }}
				>
					<h4
						className="text-lg font-semibold text-center"
						style={{ color: '#1c1c1c' }}
					>
						Descarregar Informes
					</h4>

					<div className="space-y-4">
						{evaluationResult.extractedLots.map((lotInfo) => {
							const lotEvaluations =
								groupedEvaluations.get(lotInfo.lotNumber) || [];
							const proposalsWithEvaluations = lotEvaluations.filter(
								(evaluation: LotEvaluation) => evaluation.hasProposal,
							);

							return (
								<div key={lotInfo.lotNumber} className="space-y-3">
									{hasMultipleLots && (
										<h5
											className="text-md font-medium text-center"
											style={{ color: '#6f6f6f' }}
										>
											Lot {lotInfo.lotNumber}: {lotInfo.title}
										</h5>
									)}

									<div className="flex flex-wrap justify-center gap-3">
										{proposalsWithEvaluations.map(
											(evaluation: LotEvaluation) => {
												const displayName = getDisplayName(
													evaluation.companyName,
													evaluation.proposalName,
												);
												const showCompanyIcon = hasCompanyInfo(evaluation);

												return (
													<button
														key={`${evaluation.lotNumber}-${evaluation.proposalName}`}
														onClick={() => onDownloadPDF(evaluation)}
														className="px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-300 text-white cursor-pointer transform hover:scale-105 hover:shadow-lg shadow-md"
														style={{
															background:
																'linear-gradient(135deg, #199875 0%, #188869 100%)',
														}}
														onMouseEnter={(e) => {
															e.currentTarget.style.background =
																'linear-gradient(135deg, #188869 0%, #177759 100%)';
														}}
														onMouseLeave={(e) => {
															e.currentTarget.style.background =
																'linear-gradient(135deg, #199875 0%, #188869 100%)';
														}}
													>
														{showCompanyIcon ? (
															<Building className="h-4 w-4" />
														) : (
															<FileText className="h-4 w-4" />
														)}
														<Download className="h-4 w-4" />
														<span className="max-w-40 truncate">
															{displayName}
														</span>
													</button>
												);
											},
										)}
									</div>
								</div>
							);
						})}
					</div>

					<div
						className="flex justify-center pt-4 border-t"
						style={{ borderColor: '#dfe7e6' }}
					>
						<button
							onClick={() => onDownloadPDF()}
							className="px-8 py-4 rounded-xl font-semibold flex items-center space-x-3 transition-all duration-300 text-white cursor-pointer transform hover:scale-105 hover:shadow-xl shadow-lg"
							style={{
								background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background =
									'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background =
									'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
							}}
						>
							<Download className="h-5 w-5" />
							<span>Descarregar Informe Complet</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
