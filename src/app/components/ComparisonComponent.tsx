'use client';

import React, { useState } from 'react';
import {
	GitCompare,
	Download,
	Trophy,
	Users,
	Loader2,
	CheckCircle,
} from 'lucide-react';
import type {
	ProposalComparison,
	LotEvaluation,
	LotInfo,
	FileContent,
} from '@/types';
import { apiService } from '@/lib/apiService';

interface ComparisonComponentProps {
	lotInfo: LotInfo;
	evaluatedProposals: LotEvaluation[];
	specifications: FileContent[];
	onDownloadPDF: (comparison: ProposalComparison) => void;
}

export default function ComparisonComponent({
	lotInfo,
	evaluatedProposals,
	specifications,
	onDownloadPDF,
}: ComparisonComponentProps) {
	const [comparison, setComparison] = useState<ProposalComparison | null>(null);
	const [isComparing, setIsComparing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCompare = async () => {
		setIsComparing(true);
		setError(null);

		try {
			console.log('Starting comparison with:', {
				lotInfo,
				evaluatedProposalsCount: evaluatedProposals.length,
				specificationsCount: specifications.length,
				evaluatedProposals: evaluatedProposals.map((p) => ({
					name: p.proposalName,
					lotNumber: p.lotNumber,
					hasProposal: p.hasProposal,
					criteriaCount: p.criteria.length,
				})),
			});

			const result = await apiService.compareProposals(
				specifications,
				lotInfo,
				evaluatedProposals,
			);

			console.log('Comparison result received:', result);
			setComparison(result.comparison);
		} catch (err) {
			console.error('Comparison error:', err);
			setError(
				`Error durant la comparació: ${
					err instanceof Error ? err.message : 'Error desconegut'
				}`,
			);
		} finally {
			setIsComparing(false);
		}
	};

	const getScoreColor = (score: string) => {
		switch (score) {
			case 'COMPLEIX_EXITOSAMENT':
				return '#199875';
			case 'REGULAR':
				return '#f59e0b';
			case 'INSUFICIENT':
				return '#dc2626';
			default:
				return '#6f6f6f';
		}
	};

	const getScoreText = (score: string) => {
		switch (score) {
			case 'COMPLEIX_EXITOSAMENT':
				return '🟢 Compleix exitosament';
			case 'REGULAR':
				return '🟡 Regular';
			case 'INSUFICIENT':
				return '🔴 Insuficient';
			default:
				return score;
		}
	};

	const getPositionIcon = (position: number) => {
		switch (position) {
			case 1:
				return '🥇';
			case 2:
				return '🥈';
			case 3:
				return '🥉';
			default:
				return `${position}°`;
		}
	};

	const getOverallScoreColor = (score: string) => {
		switch (score) {
			case 'EXCELLENT':
				return '#199875';
			case 'GOOD':
				return '#16a34a';
			case 'AVERAGE':
				return '#f59e0b';
			case 'POOR':
				return '#dc2626';
			default:
				return '#6f6f6f';
		}
	};

	if (!comparison && !isComparing) {
		return (
			<div className="border-t mt-6 pt-6" style={{ borderColor: '#dfe7e6' }}>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<GitCompare className="h-5 w-5" style={{ color: '#199875' }} />
						<div>
							<h4
								className="text-lg font-semibold"
								style={{ color: '#1c1c1c' }}
							>
								Comparació entre Propostes
							</h4>
							<p className="text-sm" style={{ color: '#6f6f6f' }}>
								Compara {evaluatedProposals.length} propostes per aquest lot
							</p>
						</div>
					</div>
					<button
						onClick={handleCompare}
						className="px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors text-white cursor-pointer"
						style={{ backgroundColor: '#199875' }}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#188869';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = '#199875';
						}}
					>
						<GitCompare className="h-5 w-5" />
						<span>Comparar Propostes</span>
					</button>
				</div>
				{error && (
					<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-sm text-red-800">{error}</p>
					</div>
				)}
			</div>
		);
	}

	if (isComparing) {
		return (
			<div className="border-t mt-6 pt-6" style={{ borderColor: '#dfe7e6' }}>
				<div className="text-center py-8">
					<Loader2
						className="h-8 w-8 mx-auto mb-4 animate-spin"
						style={{ color: '#199875' }}
					/>
					<h4
						className="text-lg font-semibold mb-2"
						style={{ color: '#1c1c1c' }}
					>
						Comparant Propostes...
					</h4>
					<p className="text-sm" style={{ color: '#6f6f6f' }}>
						Analitzant les diferències i similituds entre les propostes
					</p>
				</div>
			</div>
		);
	}

	if (!comparison) {
		return (
			<div className="border-t mt-6 pt-6" style={{ borderColor: '#dfe7e6' }}>
				<div className="text-center py-8">
					<CheckCircle
						className="h-8 w-8 mx-auto mb-4"
						style={{ color: '#199875' }}
					/>
					<h4
						className="text-lg font-semibold mb-2"
						style={{ color: '#1c1c1c' }}
					>
						No hi ha dades per comparar
					</h4>
					<p className="text-sm" style={{ color: '#6f6f6f' }}>
						Assegureu-vos que les propostes estan avaluades i els fitxers de
						especificacions estan carregats.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="border-t mt-6 pt-6" style={{ borderColor: '#dfe7e6' }}>
			<div
				className="px-6 py-4 mb-6"
				style={{
					background: 'linear-gradient(135deg, #199875 0%, #188869 100%)',
					borderRadius: '12px',
				}}
			>
				<h3 className="text-xl font-semibold text-white flex items-center">
					<GitCompare className="mr-2 h-5 w-5" />
					Comparació de Propostes - Lot {lotInfo.lotNumber}
				</h3>
				<p className="text-sm text-white opacity-90 mt-1">
					Anàlisi comparatiu entre {comparison.proposalNames.length} propostes |
					Confiança: {Math.round(comparison.confidence * 100)}%
				</p>
			</div>

			{/* Summary */}
			<div
				className="rounded-lg p-6 mb-6"
				style={{ backgroundColor: '#dfe7e6' }}
			>
				<h4 className="text-lg font-semibold mb-3" style={{ color: '#1c1c1c' }}>
					Resum Executiu de la Comparació
				</h4>
				<p className="leading-relaxed" style={{ color: '#6f6f6f' }}>
					{comparison.summary}
				</p>
			</div>

			{/* Global Ranking */}
			<div className="mb-8">
				<h4
					className="text-lg font-semibold mb-4 flex items-center"
					style={{ color: '#1c1c1c' }}
				>
					<Trophy className="h-5 w-5 mr-2" style={{ color: '#199875' }} />
					Rànking Global
				</h4>
				<div className="space-y-4">
					{comparison.globalRanking.map((ranking, index) => (
						<div
							key={ranking.proposalName}
							className="border rounded-lg p-6"
							style={{
								borderColor: index === 0 ? '#199875' : '#dfe7e6',
								backgroundColor: index === 0 ? '#f0fdf4' : '#ffffff',
							}}
						>
							<div className="flex items-start justify-between mb-4">
								<div className="flex items-center space-x-3">
									<span className="text-2xl">
										{getPositionIcon(ranking.position)}
									</span>
									<div>
										<h5
											className="text-lg font-semibold"
											style={{ color: '#1c1c1c' }}
										>
											{ranking.proposalName}
										</h5>
										<span
											className="px-3 py-1 rounded-full text-sm font-medium text-white"
											style={{
												backgroundColor: getOverallScoreColor(
													ranking.overallScore,
												),
											}}
										>
											{ranking.overallScore}
										</span>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
								{ranking.strengths.length > 0 && (
									<div>
										<h6
											className="font-medium mb-2"
											style={{ color: '#199875' }}
										>
											Punts Forts Principals
										</h6>
										<ul className="space-y-1">
											{ranking.strengths.map((strength, i) => (
												<li
													key={i}
													className="text-sm"
													style={{ color: '#188869' }}
												>
													• {strength}
												</li>
											))}
										</ul>
									</div>
								)}

								{ranking.weaknesses.length > 0 && (
									<div>
										<h6 className="font-medium mb-2 text-red-700">
											Punts Febles Principals
										</h6>
										<ul className="space-y-1">
											{ranking.weaknesses.map((weakness, i) => (
												<li key={i} className="text-sm text-red-600">
													• {weakness}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>

							<div
								className="rounded-lg p-4"
								style={{
									backgroundColor: '#f8f9fa',
									borderLeft: '4px solid #199875',
								}}
							>
								<h6 className="font-medium mb-2" style={{ color: '#1c1c1c' }}>
									Recomanació Específica
								</h6>
								<p className="text-sm" style={{ color: '#6f6f6f' }}>
									{ranking.recommendation}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Criteria Comparison Table */}
			<div className="mb-8">
				<h4
					className="text-lg font-semibold mb-4 flex items-center"
					style={{ color: '#1c1c1c' }}
				>
					<Users className="h-5 w-5 mr-2" style={{ color: '#199875' }} />
					Comparació Detallada per Criteris
				</h4>

				<div className="overflow-x-auto">
					<table className="w-full border-collapse border border-gray-300">
						<thead>
							<tr style={{ backgroundColor: '#dfe7e6' }}>
								<th
									className="border border-gray-300 px-4 py-3 text-left font-semibold"
									style={{ color: '#1c1c1c' }}
								>
									Criteri
								</th>
								{comparison.proposalNames.map((name) => (
									<th
										key={name}
										className="border border-gray-300 px-4 py-3 text-center font-semibold"
										style={{ color: '#1c1c1c' }}
									>
										{name}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{comparison.criteriaComparisons.map((criterionComp, index) => (
								<tr
									key={index}
									className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
								>
									<td
										className="border border-gray-300 px-4 py-3 font-medium"
										style={{ color: '#1c1c1c' }}
									>
										{criterionComp.criterion}
									</td>
									{criterionComp.proposals.map((proposal) => (
										<td
											key={proposal.proposalName}
											className="border border-gray-300 px-4 py-3 text-center"
										>
											<div className="space-y-2">
												<div className="flex items-center justify-center">
													<span className="text-lg mr-2">
														{getPositionIcon(proposal.position)}
													</span>
													<span
														className="px-2 py-1 rounded text-xs font-medium text-white"
														style={{
															backgroundColor: getScoreColor(proposal.score),
														}}
													>
														{getScoreText(proposal.score)}
													</span>
												</div>
											</div>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Detailed Criteria Analysis */}
			<div className="mb-8">
				<h4 className="text-lg font-semibold mb-4" style={{ color: '#1c1c1c' }}>
					Anàlisi Detallada per Criteris
				</h4>
				<div className="space-y-6">
					{comparison.criteriaComparisons.map((criterionComp, index) => (
						<div
							key={index}
							className="border rounded-lg p-6"
							style={{ borderColor: '#dfe7e6' }}
						>
							<h5
								className="text-md font-semibold mb-4"
								style={{ color: '#1c1c1c' }}
							>
								{index + 1}. {criterionComp.criterion}
							</h5>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{criterionComp.proposals.map((proposal) => (
									<div
										key={proposal.proposalName}
										className="border rounded-lg p-4"
										style={{
											borderColor: getScoreColor(proposal.score) + '40',
											backgroundColor:
												proposal.position === 1 ? '#f0fdf4' : '#ffffff',
										}}
									>
										<div className="flex items-center justify-between mb-3">
											<h6 className="font-medium" style={{ color: '#1c1c1c' }}>
												{proposal.proposalName}
											</h6>
											<div className="flex items-center space-x-2">
												<span className="text-lg">
													{getPositionIcon(proposal.position)}
												</span>
												<span
													className="px-2 py-1 rounded text-xs font-medium text-white"
													style={{
														backgroundColor: getScoreColor(proposal.score),
													}}
												>
													{getScoreText(proposal.score)}
												</span>
											</div>
										</div>

										<div className="space-y-2">
											{proposal.arguments.map((argument, i) => (
												<div
													key={i}
													className="text-sm p-2 rounded"
													style={{
														backgroundColor: '#f8f9fa',
														color: '#6f6f6f',
													}}
												>
													• {argument}
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Download Button */}
			<div className="flex justify-center">
				<button
					onClick={() => onDownloadPDF(comparison)}
					className="px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors text-white cursor-pointer"
					style={{ backgroundColor: '#199875' }}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = '#188869';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = '#199875';
					}}
				>
					<Download className="h-5 w-5" />
					<span>Descarregar Comparació PDF</span>
				</button>
			</div>
		</div>
	);
}
