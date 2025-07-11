'use client';

import React from 'react';
import { CheckCircle, Download } from 'lucide-react';
import type { EvaluationResult } from '@/types';

interface EvaluationResultsProps {
	evaluationResult: EvaluationResult;
	onDownloadPDF: () => void;
}

export default function EvaluationResults({
	evaluationResult,
	onDownloadPDF,
}: EvaluationResultsProps) {
	return (
		<div className="border-t" style={{ borderColor: '#dfe7e6' }}>
			<div
				className="px-6 py-4"
				style={{
					background: 'linear-gradient(135deg, #199875 0%, #188869 100%)',
				}}
			>
				<h3 className="text-xl font-semibold text-white flex items-center">
					<CheckCircle className="mr-2 h-5 w-5" />
					Resultat de l'Avaluació
				</h3>
				<p className="text-sm text-white opacity-90 mt-1">
					Confiança: {Math.round(evaluationResult.confidence * 100)}% | Criteris
					avaluats: {evaluationResult.criteria.length}
				</p>
			</div>

			<div className="p-6">
				<div
					className="rounded-lg p-4 mb-6"
					style={{
						backgroundColor: '#f8f9fa',
						borderLeft: '4px solid #199875',
					}}
				>
					<h4
						className="text-md font-semibold mb-2"
						style={{ color: '#1c1c1c' }}
					>
						Criteris Identificats
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						{evaluationResult.extractedCriteria.map((criterion, index) => (
							<div
								key={index}
								className="flex items-center text-sm"
								style={{ color: '#6f6f6f' }}
							>
								<CheckCircle
									className="h-4 w-4 mr-2"
									style={{ color: '#199875' }}
								/>
								{criterion}
							</div>
						))}
					</div>
				</div>

				<div
					className="rounded-lg p-6 mb-6"
					style={{ backgroundColor: '#dfe7e6' }}
				>
					<h4
						className="text-lg font-semibold mb-3"
						style={{ color: '#1c1c1c' }}
					>
						Resum Executiu
					</h4>
					<p className="leading-relaxed" style={{ color: '#6f6f6f' }}>
						{evaluationResult.summary}
					</p>
				</div>

				<div className="space-y-6">
					<h4 className="text-lg font-semibold" style={{ color: '#1c1c1c' }}>
						Avaluació per Criteris
					</h4>

					{evaluationResult.criteria.map((criterion, index) => (
						<div
							key={index}
							className="border rounded-lg p-6"
							style={{ borderColor: '#dfe7e6' }}
						>
							<div className="flex items-start justify-between mb-4 gap-4">
								<h5
									className="text-md font-semibold flex-1"
									style={{ color: '#1c1c1c' }}
								>
									{index + 1}. {criterion.criterion}
								</h5>
								<div className="flex items-center justify-center min-w-[200px] flex-shrink-0">
									<span
										className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap inline-flex items-center"
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

							<p className="mb-4" style={{ color: '#6f6f6f' }}>
								{criterion.justification}
							</p>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{criterion.strengths.length > 0 && (
									<div>
										<h6
											className="font-medium mb-2"
											style={{ color: '#199875' }}
										>
											Punts Forts
										</h6>
										<ul className="space-y-1">
											{criterion.strengths.map((strength, i) => (
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

								{criterion.improvements.length > 0 && (
									<div>
										<h6 className="font-medium mb-2 text-red-700">
											Àrees de Millora
										</h6>
										<ul className="space-y-1">
											{criterion.improvements.map((improvement, i) => (
												<li key={i} className="text-sm text-red-600">
													• {improvement}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>

							{criterion.references.length > 0 && (
								<div
									className="mt-4 pt-4 border-t"
									style={{ borderColor: '#dfe7e6' }}
								>
									<h6 className="font-medium mb-2" style={{ color: '#6f6f6f' }}>
										Referències
									</h6>
									<div className="flex flex-wrap gap-2">
										{criterion.references.map((ref, i) => (
											<span
												key={i}
												className="px-2 py-1 rounded text-xs"
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

				<div
					className="rounded-lg p-6 mt-6"
					style={{ backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }}
				>
					<h4
						className="text-lg font-semibold mb-3"
						style={{ color: '#856404' }}
					>
						Recomanació Final
					</h4>
					<p className="leading-relaxed" style={{ color: '#856404' }}>
						{evaluationResult.recommendation}
					</p>
				</div>

				<div className="flex justify-center mt-8">
					<button
						onClick={onDownloadPDF}
						className="px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors text-white"
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
