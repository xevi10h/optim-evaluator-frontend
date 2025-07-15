'use client';

import React from 'react';
import {
	Package,
	AlertTriangle,
	FileText,
	Users,
	CheckCircle,
	AlertCircle,
	XCircle,
} from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import ProposalEvaluation from './ProposalEvaluation';
import ComparisonComponent from './ComparisonComponent';
import type {
	LotInfo,
	LotEvaluation,
	FileContent,
	ProposalComparison,
} from '@/types';

interface LotEvaluationProps {
	lotInfo: LotInfo;
	evaluations: LotEvaluation[];
	specifications: FileContent[];
	hasMultipleLots: boolean;
	onDownloadComparisonPDF: (comparison: ProposalComparison) => void;
}

export default function LotEvaluationComponent({
	lotInfo,
	evaluations,
	specifications,
	hasMultipleLots,
	onDownloadComparisonPDF,
}: LotEvaluationProps) {
	const proposalsWithEvaluations = evaluations.filter(
		(evaluation) => evaluation.hasProposal,
	);
	const canCompare = proposalsWithEvaluations.length >= 2;

	if (evaluations.length === 0) {
		return (
			<div className="space-y-6">
				{hasMultipleLots && (
					<div
						className="flex items-center space-x-3 pb-4 border-b"
						style={{ borderColor: '#dfe7e6' }}
					>
						<Package className="h-6 w-6" style={{ color: '#199875' }} />
						<h4 className="text-lg font-semibold" style={{ color: '#1c1c1c' }}>
							Lot {lotInfo.lotNumber}: {lotInfo.title}
						</h4>
						<div
							className="flex items-center space-x-1 px-3 py-1 rounded-full"
							style={{ backgroundColor: '#fff3cd' }}
						>
							<AlertTriangle className="h-4 w-4" style={{ color: '#856404' }} />
							<span
								className="text-xs font-medium"
								style={{ color: '#856404' }}
							>
								No presentat
							</span>
						</div>
					</div>
				)}

				<div
					className="text-center py-8 rounded-lg animate-fade-in"
					style={{ backgroundColor: '#fff3cd' }}
				>
					<AlertTriangle
						className="h-12 w-12 mx-auto mb-4 animate-bounce"
						style={{ color: '#856404' }}
					/>
					<p className="text-lg font-medium" style={{ color: '#856404' }}>
						No s'ha presentat proposta per aquest lot
					</p>
					<p className="text-sm mt-2" style={{ color: '#856404' }}>
						No es pot realitzar l'avaluació sense documentació
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{hasMultipleLots && (
				<div
					className="flex items-center space-x-3 pb-4 border-b animate-slide-in-up"
					style={{ borderColor: '#dfe7e6' }}
				>
					<Package className="h-6 w-6" style={{ color: '#199875' }} />
					<h4 className="text-lg font-semibold" style={{ color: '#1c1c1c' }}>
						Lot {lotInfo.lotNumber}: {lotInfo.title}
					</h4>
					{proposalsWithEvaluations.length > 1 && (
						<div
							className="flex items-center space-x-1 px-3 py-1 rounded-full"
							style={{ backgroundColor: '#dfe7e6' }}
						>
							<Users className="h-4 w-4" style={{ color: '#199875' }} />
							<span
								className="text-xs font-medium"
								style={{ color: '#199875' }}
							>
								{proposalsWithEvaluations.length} propostes
							</span>
						</div>
					)}
				</div>
			)}

			{/* Individual Proposal Evaluations */}
			{proposalsWithEvaluations.length === 1 ? (
				<div className="animate-fade-in">
					<ProposalEvaluation
						evaluation={proposalsWithEvaluations[0]}
						showLotNumber={hasMultipleLots}
					/>
				</div>
			) : (
				<div className="space-y-4">
					{proposalsWithEvaluations.map((evaluation, evalIndex) => {
						const criteriaCount = evaluation.criteria.length;
						const excellentCount = evaluation.criteria.filter(
							(c) => c.score === 'COMPLEIX_EXITOSAMENT',
						).length;
						const regularCount = evaluation.criteria.filter(
							(c) => c.score === 'REGULAR',
						).length;
						const insufficientCount = evaluation.criteria.filter(
							(c) => c.score === 'INSUFICIENT',
						).length;

						const averageScore =
							(excellentCount * 3 + regularCount * 2 + insufficientCount * 1) /
							criteriaCount;
						const badgeColor =
							averageScore >= 2.5
								? '#199875'
								: averageScore >= 2
								? '#f59e0b'
								: '#dc2626';

						// Crear badge con mejor separación e iconos
						const createScoreBadge = () => {
							const items = [];

							if (excellentCount > 0) {
								items.push(
									<div
										key="excellent"
										className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full"
									>
										<CheckCircle className="h-3 w-3 text-green-600" />
										<span className="text-xs font-medium text-green-700">
											{excellentCount}
										</span>
									</div>,
								);
							}

							if (regularCount > 0) {
								items.push(
									<div
										key="regular"
										className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full"
									>
										<AlertCircle className="h-3 w-3 text-yellow-600" />
										<span className="text-xs font-medium text-yellow-700">
											{regularCount}
										</span>
									</div>,
								);
							}

							if (insufficientCount > 0) {
								items.push(
									<div
										key="insufficient"
										className="flex items-center space-x-1 bg-red-100 px-2 py-1 rounded-full"
									>
										<XCircle className="h-3 w-3 text-red-600" />
										<span className="text-xs font-medium text-red-700">
											{insufficientCount}
										</span>
									</div>,
								);
							}

							return <div className="flex items-center space-x-2">{items}</div>;
						};

						return (
							<div
								key={`${evaluation.lotNumber}-${evaluation.proposalName}`}
								className="animate-slide-in-up"
								style={{
									animationDelay: `${evalIndex * 150}ms`,
									animationFillMode: 'both',
								}}
							>
								<CollapsibleSection
									title={evaluation.proposalName}
									subtitle={`Confiança: ${Math.round(
										evaluation.confidence * 100,
									)}% | ${criteriaCount} criteris avaluats`}
									icon={
										<FileText
											className="h-5 w-5"
											style={{ color: '#199875' }}
										/>
									}
									isOpenByDefault={false}
									badgeText=""
									badgeColor={badgeColor}
									customBadge={createScoreBadge()}
									headerBgColor="#f8f9fa"
									className="transition-all duration-300 hover:shadow-md"
								>
									<ProposalEvaluation
										evaluation={evaluation}
										showLotNumber={hasMultipleLots}
									/>
								</CollapsibleSection>
							</div>
						);
					})}
				</div>
			)}

			{/* Comparison Section */}
			{canCompare && (
				<div
					className="animate-fade-in"
					style={{ animationDelay: '300ms', animationFillMode: 'both' }}
				>
					<CollapsibleSection
						title="Comparació entre Propostes"
						subtitle={`Anàlisi comparatiu detallat entre ${proposalsWithEvaluations.length} propostes`}
						icon={<Users className="h-5 w-5" style={{ color: '#199875' }} />}
						isOpenByDefault={false}
						badgeText="Comparar"
						badgeColor="#3b82f6"
						headerBgColor="#f0f9ff"
						headerColor="#1e40af"
						className="border-2 border-dashed transition-all duration-300 hover:border-solid hover:shadow-lg"
					>
						<ComparisonComponent
							lotInfo={lotInfo}
							evaluatedProposals={proposalsWithEvaluations}
							specifications={specifications}
							onDownloadPDF={onDownloadComparisonPDF}
						/>
					</CollapsibleSection>
				</div>
			)}
		</div>
	);
}
