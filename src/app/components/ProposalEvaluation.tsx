'use client';

import React from 'react';
import { Package, FileText, Building, Info } from 'lucide-react';
import type { LotEvaluation } from '@/types';
import { getDisplayName, hasCompanyInfo } from '@/types';

interface ProposalEvaluationProps {
	evaluation: LotEvaluation;
	showLotNumber?: boolean;
}

export default function ProposalEvaluation({
	evaluation,
	showLotNumber = false,
}: ProposalEvaluationProps) {
	const displayName = getDisplayName(
		evaluation.companyName,
		evaluation.proposalName,
	);
	const showCompanyInfo = hasCompanyInfo(evaluation);

	return (
		<div className="p-6 space-y-6">
			{/* Resum */}
			<div
				className="rounded-lg p-4"
				style={{
					backgroundColor: '#f8f9fa',
					borderLeft: '4px solid #199875',
				}}
			>
				<h6 className="text-md font-semibold mb-2" style={{ color: '#1c1c1c' }}>
					Resum de l'Avaluació
				</h6>
				<p className="text-sm leading-relaxed" style={{ color: '#6f6f6f' }}>
					{evaluation.summary}
				</p>
			</div>

			{/* Avaluació per criteris */}
			<div className="space-y-6">
				<h6
					className="text-lg font-semibold flex items-center"
					style={{ color: '#1c1c1c' }}
				>
					<FileText className="h-5 w-5 mr-2" style={{ color: '#199875' }} />
					Avaluació per Criteris
				</h6>

				{evaluation.criteria.map((criterion, index) => (
					<div
						key={index}
						className="border rounded-lg p-6 transition-all duration-200 hover:shadow-sm"
						style={{ borderColor: '#dfe7e6' }}
					>
						<div className="flex items-start justify-between mb-4 gap-4">
							<h6
								className="text-md font-semibold flex-1"
								style={{ color: '#1c1c1c' }}
							>
								{index + 1}. {criterion.criterion}
							</h6>
							<div className="flex items-center justify-center min-w-[200px] flex-shrink-0">
								<span
									className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap inline-flex items-center transform transition-transform duration-200 hover:scale-105"
									style={{
										backgroundColor:
											criterion.score === 'COMPLEIX_EXITOSAMENT'
												? '#199875'
												: criterion.score === 'REGULAR'
												? '#f59e0b'
												: '#dc2626',
										color: 'white',
									}}
								>
									{criterion.score === 'COMPLEIX_EXITOSAMENT'
										? '🟢 Compleix exitosament'
										: criterion.score === 'REGULAR'
										? '🟡 Regular'
										: '🔴 Insuficient'}
								</span>
							</div>
						</div>

						<p className="mb-4 leading-relaxed" style={{ color: '#6f6f6f' }}>
							{criterion.justification}
						</p>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{criterion.strengths.length > 0 && (
								<div className="animate-fade-in">
									<h6
										className="font-medium mb-2 flex items-center"
										style={{ color: '#199875' }}
									>
										<span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
										Punts Forts
									</h6>
									<ul className="space-y-1">
										{criterion.strengths.map((strength, i) => (
											<li
												key={i}
												className="text-sm transition-all duration-200 hover:translate-x-1"
												style={{ color: '#188869' }}
											>
												• {strength}
											</li>
										))}
									</ul>
								</div>
							)}

							{criterion.improvements.length > 0 && (
								<div className="animate-fade-in">
									<h6 className="font-medium mb-2 text-red-700 flex items-center">
										<span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
										Àrees de Millora
									</h6>
									<ul className="space-y-1">
										{criterion.improvements.map((improvement, i) => (
											<li
												key={i}
												className="text-sm text-red-600 transition-all duration-200 hover:translate-x-1"
											>
												• {improvement}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>

						{criterion.references.length > 0 && (
							<div
								className="mt-4 pt-4 border-t animate-fade-in"
								style={{ borderColor: '#dfe7e6' }}
							>
								<h6
									className="font-medium mb-2 flex items-center"
									style={{ color: '#6f6f6f' }}
								>
									<span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
									Referències
								</h6>
								<div className="flex flex-wrap gap-2">
									{criterion.references.map((ref, i) => (
										<span
											key={i}
											className="px-2 py-1 rounded text-xs transition-all duration-200 hover:scale-105"
											style={{
												backgroundColor: '#f3f4f6',
												color: '#6f6f6f',
											}}
										>
											{ref}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Recomanació */}
			<div
				className="rounded-lg p-4 animate-fade-in"
				style={{
					backgroundColor: '#e8f4fd',
					borderColor: '#b3d9f2',
					border: '1px solid',
				}}
			>
				<h6
					className="text-md font-semibold mb-2 flex items-center"
					style={{ color: '#0369a1' }}
				>
					<Package className="h-4 w-4 mr-2" />
					Anàlisi de la Proposta
				</h6>
				<div className="text-sm leading-relaxed" style={{ color: '#0369a1' }}>
					{evaluation.recommendation.split('\n').map((paragraph, i) => (
						<p key={i} className={i > 0 ? 'mt-2' : ''}>
							{paragraph}
						</p>
					))}
				</div>
			</div>
		</div>
	);
}
