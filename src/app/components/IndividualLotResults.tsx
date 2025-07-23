// src/app/components/IndividualLotResults.tsx - Shows individual lot evaluation results
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
	LotEvaluation,
	FileContent,
	ProposalComparison,
	LotInfo,
} from '@/types';

interface IndividualLotEvaluation {
	lotNumber: number;
	lotTitle: string;
	evaluations: LotEvaluation[];
	timestamp: number;
}

interface IndividualLotResultsProps {
	lotResults: Map<number, IndividualLotEvaluation>;
	specifications: FileContent[];
	onDownloadPDF: (evaluation?: LotEvaluation) => void;
	onDownloadComparisonPDF: (comparison: ProposalComparison) => void;
	// Nuevas props para manejar la comparación
	isComparing: boolean;
	onStartComparison: (lotInfo: LotInfo) => void;
	onComparisonComplete: (comparison: ProposalComparison) => void;
	onComparisonError: (error: string) => void;
}

export default function IndividualLotResults({
	lotResults,
	specifications,
	onDownloadPDF,
	onDownloadComparisonPDF,
	isComparing,
	onStartComparison,
	onComparisonComplete,
	onComparisonError,
}: IndividualLotResultsProps) {
	if (lotResults.size === 0) return null;

	// Convert Map to Array and sort by lot number
	const sortedResults = Array.from(lotResults.values()).sort(
		(a, b) => a.lotNumber - b.lotNumber,
	);

	// Calculate overall statistics
	const totalEvaluations = sortedResults.reduce(
		(sum, result) => sum + result.evaluations.length,
		0,
	);

	const companiesIdentified = sortedResults.reduce(
		(sum, result) => sum + result.evaluations.filter(hasCompanyInfo).length,
		0,
	);

	const totalProposals = sortedResults.reduce(
		(sum, result) =>
			sum + result.evaluations.filter((e) => e.hasProposal).length,
		0,
	);

	return (
		<div
			className="border-t animate-fade-in"
			style={{ borderColor: '#dfe7e6' }}
		>
			<div
				className="px-6 py-4 animate-slide-in-up"
				style={{
					background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
				}}
			>
				<h3 className="text-xl font-semibold text-white flex items-center">
					<CheckCircle className="mr-2 h-5 w-5 animate-bounce" />
					Resultats d'Avaluació Individual
				</h3>
				<p className="text-sm text-blue-100 opacity-90 mt-1">
					{sortedResults.length} lot{sortedResults.length > 1 ? 's' : ''}{' '}
					avaluat{sortedResults.length > 1 ? 's' : ''} individualment | Anàlisi
					detallada disponible
				</p>
			</div>

			<div className="p-6 space-y-8">
				{/* Statistics Summary */}
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
									{sortedResults.length}
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

				{/* Individual Lot Results */}
				<div className="space-y-8">
					{sortedResults.map((result, index) => {
						// Find lot info
						const lotInfo = {
							lotNumber: result.lotNumber,
							title: result.lotTitle,
						};

						return (
							<div
								key={result.lotNumber}
								className="animate-slide-in-up"
								style={{
									animationDelay: `${index * 0.2}s`,
									animationFillMode: 'both',
								}}
							>
								<LotEvaluationComponent
									lotInfo={lotInfo}
									evaluations={result.evaluations}
									specifications={specifications}
									hasMultipleLots={sortedResults.length > 1}
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
			</div>
		</div>
	);
}
