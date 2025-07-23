'use client';

import React from 'react';
import {
	CheckCircle,
	Package,
	FileText,
	TrendingUp,
	Building,
} from 'lucide-react';
import LotEvaluationComponent from './LotEvaluation';
import { hasCompanyInfo } from '@/types';
import type {
	EvaluationResult,
	FileContent,
	ProposalComparison,
	LotEvaluation,
	LotInfo,
} from '@/types';

interface EvaluationResultsProps {
	evaluationResult: EvaluationResult;
	specifications: FileContent[];
	onDownloadPDF: (evaluation?: LotEvaluation) => void;
	onDownloadComparisonPDF: (comparison: ProposalComparison) => void;
	// Nuevas props para manejar la comparación
	isComparing: boolean;
	onStartComparison: (lotInfo: LotInfo) => void;
	onComparisonComplete: (comparison: ProposalComparison) => void;
	onComparisonError: (error: string) => void;
}

export default function EvaluationResults({
	evaluationResult,
	specifications,
	onDownloadPDF,
	onDownloadComparisonPDF,
	isComparing,
	onStartComparison,
	onComparisonComplete,
	onComparisonError,
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
				<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 animate-fade-in">
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
									onDownloadPDF={onDownloadPDF}
									isComparing={isComparing}
									onStartComparison={onStartComparison}
									onComparisonComplete={onComparisonComplete}
									onComparisonError={onComparisonError}
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
								<TrendingUp className="h-5 w-5 text-blue-700" />
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

				{/* INFO: Download section has been moved to individual lots */}
				<div
					className="animate-fade-in bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200"
					style={{ animationDelay: '1s', animationFillMode: 'both' }}
				>
					<div className="text-center">
						<div className="p-3 bg-green-100 rounded-full mx-auto w-fit mb-4">
							<CheckCircle className="h-8 w-8 text-green-600" />
						</div>
						<h4 className="text-lg font-bold text-green-800 mb-2">
							Avaluació Completada amb Èxit
						</h4>
						<p className="text-sm text-green-700 max-w-2xl mx-auto">
							Tots els informes es poden descarregar des de la secció de cada
							lot. Cada lot inclou els informes individuals de les seves
							propostes i, si és possible, l'informe comparatiu entre empreses.
						</p>
						<div className="flex items-center justify-center space-x-6 mt-4 text-xs text-green-600">
							<div className="flex items-center space-x-2">
								<div className="w-2 h-2 bg-green-500 rounded-full"></div>
								<span>Informes individuals dins de cada lot</span>
							</div>
							<div className="flex items-center space-x-2">
								<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
								<span>
									Comparació disponible per lots amb múltiples propostes
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
