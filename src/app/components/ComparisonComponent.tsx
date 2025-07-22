'use client';

import React, { useState } from 'react';
import {
	GitCompare,
	Download,
	Trophy,
	Users,
	CheckCircle,
	Star,
	Award,
	TrendingUp,
	Building,
	FileText,
} from 'lucide-react';
import { getDisplayName, getShortDisplayName } from '@/types';
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
	// Nuevas props para manejar el loader desde el padre
	isComparing: boolean;
	onStartComparison: () => void;
	onComparisonComplete: (comparison: ProposalComparison) => void;
	onComparisonError: (error: string) => void;
}

export default function ComparisonComponent({
	lotInfo,
	evaluatedProposals,
	specifications,
	onDownloadPDF,
	isComparing,
	onStartComparison,
	onComparisonComplete,
	onComparisonError,
}: ComparisonComponentProps) {
	const [comparison, setComparison] = useState<ProposalComparison | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleCompare = async () => {
		onStartComparison(); // Notificar al padre que empiece la comparación
		setError(null);

		try {
			console.log('Starting comparison with:', {
				lotInfo,
				evaluatedProposalsCount: evaluatedProposals.length,
				specificationsCount: specifications.length,
				evaluatedProposals: evaluatedProposals.map((p) => ({
					name: p.proposalName,
					company: p.companyName,
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
			onComparisonComplete(result.comparison); // Notificar al padre que terminó
		} catch (err) {
			console.error('Comparison error:', err);
			const errorMessage = `Error durant la comparació: ${
				err instanceof Error ? err.message : 'Error desconegut'
			}`;
			setError(errorMessage);
			onComparisonError(errorMessage); // Notificar el error al padre
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
				return 'Compleix exitosament';
			case 'REGULAR':
				return 'Regular';
			case 'INSUFICIENT':
				return 'Insuficient';
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
			case 4:
				return '4t';
			default:
				return `${position}è`;
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

	// Si está comparando, mostrar mensaje de carga simple
	if (isComparing) {
		return (
			<div className="p-6">
				<div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-8 text-center border border-green-200">
					<h4 className="text-xl font-bold text-green-900 mb-3">
						Comparació en procés...
					</h4>
					<p className="text-green-700">
						Analitzant les diferències i similituds entre les empreses
					</p>
				</div>
			</div>
		);
	}

	if (!comparison && !isComparing) {
		return (
			<div className="p-6">
				<div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 text-center border border-blue-200">
					<div className="flex items-center justify-center space-x-3 mb-6">
						<div>
							<h4 className="text-xl font-bold text-blue-900 mb-2">
								Comparació entre Empreses
							</h4>
							<p className="text-blue-700">
								Compara {evaluatedProposals.length} propostes per aquest lot amb
								anàlisi detallada
							</p>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4 mb-6">
						<div className="bg-white rounded-lg p-4 border border-blue-200">
							<div className="flex items-center justify-center mb-2">
								<Award className="h-6 w-6 text-blue-600" />
							</div>
							<p className="text-sm font-medium text-blue-900">
								Rànking Global
							</p>
							<p className="text-xs text-blue-700">
								Posicionament de cada empresa
							</p>
						</div>
						<div className="bg-white rounded-lg p-4 border border-blue-200">
							<div className="flex items-center justify-center mb-2">
								<TrendingUp className="h-6 w-6 text-blue-600" />
							</div>
							<p className="text-sm font-medium text-blue-900">
								Anàlisi per Criteris
							</p>
							<p className="text-xs text-blue-700">Comparació detallada</p>
						</div>
						<div className="bg-white rounded-lg p-4 border border-blue-200">
							<div className="flex items-center justify-center mb-2">
								<Star className="h-6 w-6 text-blue-600" />
							</div>
							<p className="text-sm font-medium text-blue-900">Recomanacions</p>
							<p className="text-xs text-blue-700">Punts forts i febles</p>
						</div>
					</div>

					<button
						onClick={handleCompare}
						disabled={isComparing}
						className={`px-8 py-4 rounded-xl font-semibold flex items-center space-x-3 transition-all duration-300 text-white shadow-lg mx-auto ${
							isComparing
								? 'opacity-50 cursor-not-allowed'
								: 'cursor-pointer transform hover:scale-105'
						}`}
						style={{
							background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
						}}
						onMouseEnter={(e) => {
							if (!isComparing) {
								e.currentTarget.style.background =
									'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
							}
						}}
						onMouseLeave={(e) => {
							if (!isComparing) {
								e.currentTarget.style.background =
									'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
							}
						}}
					>
						<GitCompare className="h-5 w-5" />
						<span>Iniciar Comparació</span>
					</button>
				</div>

				{error && (
					<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-sm text-red-800">{error}</p>
					</div>
				)}
			</div>
		);
	}

	if (!comparison) {
		return (
			<div className="p-6">
				<div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center border border-gray-200">
					<CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-500" />
					<h4 className="text-xl font-bold text-gray-900 mb-2">
						No hi ha dades per comparar
					</h4>
					<p className="text-gray-600">
						Assegureu-vos que les propostes estan avaluades i els fitxers
						d'especificacions estan carregats.
					</p>
				</div>
			</div>
		);
	}

	// Calcular noms d'empresa per mostrar
	const displayNames = comparison.proposalNames.map((name, index) => {
		const companyName = comparison.companyNames[index];
		return getDisplayName(companyName, name);
	});

	const shortDisplayNames = comparison.proposalNames.map((name, index) => {
		const companyName = comparison.companyNames[index];
		return getShortDisplayName(companyName, name);
	});

	// Comptar empreses identificades
	const companiesIdentified = comparison.companyNames.filter(
		(name) => name !== null && name.trim().length > 0,
	).length;

	return (
		<div className="p-6 space-y-8">
			{/* Header millorat */}
			<div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<div className="p-3 bg-white bg-opacity-20 rounded-full">
							<GitCompare className="h-8 w-8" />
						</div>
						<div>
							<h3 className="text-2xl font-bold">Comparació d'Empreses</h3>
							<p className="text-blue-100">
								Lot {lotInfo.lotNumber}: {lotInfo.title}
							</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-sm opacity-90">
							{comparison.proposalNames.length} propostes analitzades
						</p>
						<p className="text-sm opacity-90">
							{companiesIdentified}/{comparison.proposalNames.length} empreses
							identificades
						</p>
					</div>
				</div>
			</div>

			{/* Resum millorat */}
			<div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
				<h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
					<div className="p-2 bg-slate-200 rounded-lg mr-3">
						<CheckCircle className="h-6 w-6 text-slate-700" />
					</div>
					Resum Executiu de la Comparació
				</h4>
				<div className="bg-white p-5 rounded-lg border border-slate-200">
					<p className="leading-relaxed text-slate-700">{comparison.summary}</p>
				</div>
			</div>

			{/* Rànking Global millorat */}
			<div>
				<h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
					<div className="p-2 bg-yellow-100 rounded-lg mr-3">
						<Trophy className="h-6 w-6 text-yellow-600" />
					</div>
					Rànking Global d'Empreses
				</h4>
				<div className="space-y-6">
					{comparison.globalRanking.map((ranking, index) => {
						const displayName = getDisplayName(
							ranking.companyName,
							ranking.proposalName,
						);
						const showCompanyIcon =
							ranking.companyName !== null &&
							ranking.companyName.trim().length > 0;

						return (
							<div
								key={ranking.proposalName}
								className={`rounded-xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${
									index === 0
										? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50'
										: 'border-slate-200 bg-white hover:border-slate-300'
								}`}
							>
								<div className="flex items-start justify-between mb-6">
									<div className="flex items-center space-x-4">
										<div
											className={`text-4xl ${
												index === 0 ? 'animate-bounce' : ''
											}`}
										>
											{getPositionIcon(ranking.position)}
										</div>
										<div className="flex items-center space-x-3">
											{showCompanyIcon ? (
												<Building className="h-6 w-6 text-slate-600" />
											) : (
												<FileText className="h-6 w-6 text-slate-600" />
											)}
											<div>
												<h5 className="text-xl font-bold text-slate-900">
													{displayName}
												</h5>
												<span
													className="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white mt-2"
													style={{
														backgroundColor: getOverallScoreColor(
															ranking.overallScore,
														),
													}}
												>
													{ranking.overallScore}
												</span>
												{!showCompanyIcon && (
													<p className="text-xs text-gray-500 mt-1">
														Empresa no identificada
													</p>
												)}
											</div>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
									{ranking.strengths.length > 0 && (
										<div className="bg-green-50 rounded-lg p-4 border border-green-200">
											<h6 className="font-bold text-green-800 mb-3">
												Punts Forts Principals
											</h6>
											<ul className="space-y-2">
												{ranking.strengths.map((strength, i) => (
													<li
														key={i}
														className="text-sm text-green-700 flex items-start"
													>
														<span className="text-green-500 mr-2 mt-1">•</span>
														<span>{strength}</span>
													</li>
												))}
											</ul>
										</div>
									)}

									{ranking.weaknesses.length > 0 && (
										<div className="bg-red-50 rounded-lg p-4 border border-red-200">
											<h6 className="font-bold text-red-800 mb-3">
												Punts Febles Principals
											</h6>
											<ul className="space-y-2">
												{ranking.weaknesses.map((weakness, i) => (
													<li
														key={i}
														className="text-sm text-red-700 flex items-start"
													>
														<span className="text-red-500 mr-2 mt-1">•</span>
														<span>{weakness}</span>
													</li>
												))}
											</ul>
										</div>
									)}
								</div>

								<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
									<h6 className="font-bold text-blue-800 mb-2">
										Recomanació Específica
									</h6>
									<p className="text-sm text-blue-700">
										{ranking.recommendation}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Taula de Comparació de Criteris millorada */}
			<div>
				<h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
					<div className="p-2 bg-purple-100 rounded-lg mr-3">
						<Users className="h-6 w-6 text-purple-600" />
					</div>
					Comparació Detallada per Criteris
				</h4>

				<div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gradient-to-r from-slate-100 to-slate-200">
								<tr>
									<th className="px-6 py-4 text-left font-bold text-slate-900 border-b border-slate-300">
										Criteri
									</th>
									{shortDisplayNames.map((displayName, index) => {
										const companyName = comparison.companyNames[index];
										const showCompanyIcon =
											companyName !== null && companyName.trim().length > 0;

										return (
											<th
												key={comparison.proposalNames[index]}
												className="px-6 py-4 text-center font-bold text-slate-900 border-b border-slate-300"
											>
												<div className="flex flex-col items-center space-y-1">
													{showCompanyIcon ? (
														<Building className="h-4 w-4 text-slate-600" />
													) : (
														<FileText className="h-4 w-4 text-slate-600" />
													)}
													<span className="text-sm">{displayName}</span>
												</div>
											</th>
										);
									})}
								</tr>
							</thead>
							<tbody>
								{comparison.criteriaComparisons.map((criterionComp, index) => (
									<tr
										key={index}
										className={`transition-colors hover:bg-slate-50 ${
											index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
										}`}
									>
										<td className="px-6 py-4 font-medium text-slate-900 border-b border-slate-200">
											{criterionComp.criterion}
										</td>
										{criterionComp.proposals.map((proposal) => (
											<td
												key={proposal.proposalName}
												className="px-6 py-4 text-center border-b border-slate-200"
											>
												<div className="flex flex-col items-center gap-4">
													<div className="text-l">
														{getPositionIcon(proposal.position)}
													</div>
													<div
														className="px-3 py-1 rounded-full text-xs font-semibold text-white justify-center items-center"
														style={{
															backgroundColor: getScoreColor(proposal.score),
														}}
													>
														{getScoreText(proposal.score)}
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
			</div>

			{/* Anàlisi Detallada per Criteris millorada */}
			<div>
				<h4 className="text-xl font-bold text-slate-900 mb-6">
					Anàlisi Detallada per Criteris
				</h4>
				<div className="space-y-8">
					{comparison.criteriaComparisons.map((criterionComp, index) => (
						<div
							key={index}
							className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
						>
							<div className="bg-gradient-to-r from-slate-100 to-slate-200 px-6 py-4 border-b border-slate-300">
								<h5 className="text-lg font-bold text-slate-900">
									{index + 1}. {criterionComp.criterion}
								</h5>
							</div>

							<div className="p-6">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{criterionComp.proposals.map((proposal) => {
										const displayName = getDisplayName(
											proposal.companyName,
											proposal.proposalName,
										);
										const showCompanyIcon =
											proposal.companyName !== null &&
											proposal.companyName.trim().length > 0;

										return (
											<div
												key={proposal.proposalName}
												className={`rounded-lg p-4 border-2 transition-all duration-300 hover:shadow-md ${
													proposal.position === 1
														? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50'
														: 'border-slate-200 bg-slate-50 hover:border-slate-300'
												}`}
											>
												<div className="flex items-start justify-between mb-4">
													<div className="flex items-center space-x-2 flex-1">
														{showCompanyIcon ? (
															<Building className="h-4 w-4 text-slate-600 flex-shrink-0" />
														) : (
															<FileText className="h-4 w-4 text-slate-600 flex-shrink-0" />
														)}
														<h6 className="font-bold text-slate-900 text-sm">
															{displayName}
														</h6>
													</div>
													<div className="flex flex-col items-center gap-2 max-w-[30%] justify-center">
														<span className="text-sm">
															{getPositionIcon(proposal.position)}
														</span>
														<span
															className="flex whitespace-nowrap px-2 py-1 rounded-full text-xs font-semibold text-white justify-center items-center"
															style={{
																backgroundColor: getScoreColor(proposal.score),
															}}
														>
															{getScoreText(proposal.score)}
														</span>
													</div>
												</div>

												<div className="space-y-3">
													{proposal.arguments.map((argument, i) => (
														<div
															key={i}
															className="text-sm p-3 rounded-lg bg-white border border-slate-200"
														>
															<span className="text-slate-600">
																• {argument}
															</span>
														</div>
													))}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Botó de descàrrega millorat */}
			<div className="pt-8 pb-4">
				<div className="flex justify-center">
					<button
						onClick={() => onDownloadPDF(comparison)}
						className="px-8 py-4 rounded-xl font-semibold flex items-center space-x-3 transition-all duration-300 text-white cursor-pointer transform hover:scale-105 shadow-lg"
						style={{
							background: 'linear-gradient(135deg, #199875 0%, #188869 100%)',
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
						<Download className="h-5 w-5" />
						<span>Descarregar Comparació PDF</span>
					</button>
				</div>
			</div>
		</div>
	);
}
