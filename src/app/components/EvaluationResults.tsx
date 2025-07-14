'use client';

import React from 'react';
import { CheckCircle, Download } from 'lucide-react';
import LotEvaluationComponent from './LotEvaluation';
import type {
	EvaluationResult,
	FileContent,
	ProposalComparison,
} from '@/types';

interface EvaluationResultsProps {
	evaluationResult: EvaluationResult;
	specifications: FileContent[];
	onDownloadPDF: () => void;
	onDownloadComparisonPDF: (comparison: ProposalComparison) => void;
}

export default function EvaluationResults({
	evaluationResult,
	specifications,
	onDownloadPDF,
	onDownloadComparisonPDF,
}: EvaluationResultsProps) {
	const hasMultipleLots = evaluationResult.extractedLots.length > 1;
	const totalCriteria = evaluationResult.lots.reduce(
		(sum, lot) => sum + lot.criteria.length,
		0,
	);

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

	return (
		<div
			className="border-t animate-fade-in"
			style={{ borderColor: '#dfe7e6' }}
		>
			{/* Header */}
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
					{hasMultipleLots
						? `Lots avaluats: ${evaluationResult.extractedLots.length} | `
						: ''}
					Criteris avaluats: {totalCriteria} | Confiança:{' '}
					{Math.round(evaluationResult.overallConfidence * 100)}%
				</p>
			</div>

			<div className="p-6 space-y-8">
				{/* Overall Summary */}
				{evaluationResult.overallSummary && (
					<div
						className="rounded-lg p-6 animate-fade-in"
						style={{
							backgroundColor: '#dfe7e6',
							animationDelay: '0.1s',
							animationFillMode: 'both',
						}}
					>
						<h4
							className="text-lg font-semibold mb-3"
							style={{ color: '#1c1c1c' }}
						>
							Resum General
						</h4>
						<p className="leading-relaxed" style={{ color: '#6f6f6f' }}>
							{evaluationResult.overallSummary}
						</p>
					</div>
				)}

				{/* Lot Evaluations */}
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

				{/* Overall Recommendation */}
				{evaluationResult.overallRecommendation && (
					<div
						className="rounded-lg p-6 animate-fade-in"
						style={{
							backgroundColor: '#e8f4fd',
							borderColor: '#b3d9f2',
							border: '1px solid',
							animationDelay: '0.8s',
							animationFillMode: 'both',
						}}
					>
						<h4
							className="text-lg font-semibold mb-3"
							style={{ color: '#0369a1' }}
						>
							Anàlisi General
						</h4>
						<div className="leading-relaxed" style={{ color: '#0369a1' }}>
							{evaluationResult.overallRecommendation
								.split('\n')
								.map((paragraph, i) => (
									<p key={i} className={i > 0 ? 'mt-2' : ''}>
										{paragraph}
									</p>
								))}
						</div>
					</div>
				)}

				{/* Download Button */}
				<div
					className="flex justify-center animate-fade-in"
					style={{ animationDelay: '1s', animationFillMode: 'both' }}
				>
					<button
						onClick={onDownloadPDF}
						className="px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-300 text-white cursor-pointer transform hover:scale-105 hover:shadow-lg"
						style={{ backgroundColor: '#199875' }}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#188869';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = '#199875';
						}}
					>
						<Download className="h-5 w-5" />
						<span>Descarregar Informe PDF</span>
					</button>
				</div>
			</div>
		</div>
	);
}
