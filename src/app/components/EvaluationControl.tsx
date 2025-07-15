'use client';

import React from 'react';
import { AlertCircle, Brain, Loader2, Sparkles } from 'lucide-react';

interface EvaluationControlProps {
	onEvaluate: () => void;
	isEvaluating: boolean;
	isProcessing: boolean;
	error: string | null;
	evaluationStatus: string;
	totalProposals: number;
}

export default function EvaluationControl({
	onEvaluate,
	isEvaluating,
	isProcessing,
	error,
	evaluationStatus,
	totalProposals,
}: EvaluationControlProps) {
	const isDisabled = isEvaluating || isProcessing;

	const getButtonText = () => {
		if (isEvaluating) {
			return totalProposals > 1
				? 'Avaluant propostes...'
				: 'Avaluant proposta...';
		}
		if (isProcessing) {
			return 'Processant arxius...';
		}
		return totalProposals > 1 ? 'Avaluar Propostes' : 'Avaluar Proposta';
	};

	return (
		<div
			className="border-t px-6 py-4"
			style={{ borderColor: '#dfe7e6', backgroundColor: '#dfe7e6' }}
		>
			<div className="flex justify-between items-center">
				<div className="flex items-center space-x-4">
					{error && (
						<div className="flex items-center text-red-600">
							<AlertCircle className="h-5 w-5 mr-2" />
							<span className="text-sm">{error}</span>
						</div>
					)}
					{evaluationStatus && (
						<div className="flex items-center" style={{ color: '#199875' }}>
							<Brain className="h-5 w-5 mr-2" />
							<span className="text-sm">{evaluationStatus}</span>
						</div>
					)}
					{isProcessing && (
						<div className="flex items-center" style={{ color: '#199875' }}>
							<Loader2 className="h-5 w-5 mr-2 animate-spin" />
							<span className="text-sm">Processant arxius...</span>
						</div>
					)}
				</div>

				<div className="flex items-center space-x-4">
					{/* Mostrar informació del total de propostes */}
					{totalProposals > 0 && !isDisabled && (
						<div className="text-sm text-gray-600">
							{totalProposals} {totalProposals === 1 ? 'proposta' : 'propostes'}{' '}
							per avaluar
						</div>
					)}

					<button
						onClick={onEvaluate}
						disabled={isDisabled}
						className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 text-white ${
							isDisabled
								? 'cursor-not-allowed opacity-60'
								: 'cursor-pointer hover:shadow-lg transform hover:scale-105'
						}`}
						style={{
							backgroundColor: isDisabled ? '#949494' : '#199875',
						}}
						onMouseEnter={(e) => {
							if (!isDisabled) {
								e.currentTarget.style.backgroundColor = '#188869';
							}
						}}
						onMouseLeave={(e) => {
							if (!isDisabled) {
								e.currentTarget.style.backgroundColor = '#199875';
							}
						}}
					>
						{isEvaluating ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin" />
								<span>{getButtonText()}</span>
							</>
						) : isProcessing ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin" />
								<span>{getButtonText()}</span>
							</>
						) : (
							<>
								<Sparkles className="h-5 w-5" />
								<span>{getButtonText()}</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
