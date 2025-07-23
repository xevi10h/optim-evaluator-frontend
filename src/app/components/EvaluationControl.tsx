'use client';

import React from 'react';
import { AlertCircle, Loader2, Sparkles, Package } from 'lucide-react';

interface EvaluationControlProps {
	onEvaluateAll: () => void;
	isEvaluating: boolean;
	isProcessing: boolean;
	error: string | null;
	totalProposals: number;
	lotsWithProposals: number;
	totalLots: number;
}

export default function EvaluationControl({
	onEvaluateAll,
	isEvaluating,
	isProcessing,
	error,
	totalProposals,
	lotsWithProposals,
	totalLots,
}: EvaluationControlProps) {
	const isDisabled = isEvaluating || isProcessing || lotsWithProposals === 0;
	const lotsWithoutProposals = totalLots - lotsWithProposals;

	const getButtonText = () => {
		if (isEvaluating) {
			return lotsWithProposals > 1
				? 'Avaluant tots els lots...'
				: 'Avaluant lot...';
		}
		if (isProcessing) {
			return 'Processant arxius...';
		}
		return 'Avaluar Tots els Lots';
	};

	const getButtonDescription = () => {
		if (lotsWithProposals === 0) {
			return 'No hi ha propostes per avaluar';
		}

		let description = `${lotsWithProposals} lot${
			lotsWithProposals > 1 ? 's' : ''
		} amb ${totalProposals} propost${totalProposals > 1 ? 'es' : 'a'}`;

		if (lotsWithoutProposals > 0) {
			description += ` • ${lotsWithoutProposals} lot${
				lotsWithoutProposals > 1 ? 's' : ''
			} sense propostes (s'ometran)`;
		}

		return description;
	};

	return (
		<div className="space-y-4">
			{/* Error Display */}
			{error && (
				<div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
					<AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
					<div className="flex-1">
						<p className="text-sm font-medium text-red-800">
							Error d'avaluació
						</p>
						<p className="text-sm text-red-700 mt-1">{error}</p>
					</div>
				</div>
			)}

			{/* Processing Status */}
			{isProcessing && (
				<div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
					<Loader2 className="h-5 w-5 text-green-600 animate-spin" />
					<span className="text-sm font-medium text-green-800">
						Processant arxius...
					</span>
				</div>
			)}

			{/* Main Evaluation Control */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					{/* Lot Summary */}
					<div className="flex items-center space-x-2">
						<Package className="h-5 w-5 text-gray-600" />
						<div className="text-sm text-gray-700">
							<p className="font-medium">{getButtonDescription()}</p>
							{totalLots > 1 && (
								<p className="text-xs text-gray-500">
									Total: {totalLots} lot{totalLots > 1 ? 's' : ''} identificat
									{totalLots > 1 ? 's' : ''}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Evaluate All Button */}
				{lotsWithProposals > 1 && (
					<button
						onClick={onEvaluateAll}
						disabled={isDisabled}
						className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 text-white ${
							isDisabled
								? 'cursor-not-allowed opacity-60 bg-gray-400'
								: 'cursor-pointer hover:shadow-lg transform hover:scale-105 bg-green-600 hover:bg-green-700'
						}`}
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
				)}
			</div>

			{/* Info Section for Multiple Lots */}
			{totalLots > 1 &&
				lotsWithProposals > 0 &&
				!isEvaluating &&
				!isProcessing && (
					<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
						<div className="flex items-start space-x-3">
							<div className="p-1 bg-green-100 rounded">
								<Sparkles className="h-4 w-4 text-green-600" />
							</div>
							<div className="flex-1">
								<h5 className="text-sm font-medium text-green-800 mb-1">
									Avaluació Intel·ligent
								</h5>
								<p className="text-xs text-green-700 leading-relaxed">
									L'avaluació completa processarà automàticament només els lots
									amb propostes presentades
									{lotsWithoutProposals > 0 && (
										<>
											, ometent {lotsWithoutProposals} lot
											{lotsWithoutProposals > 1 ? 's' : ''} sense propostes
										</>
									)}
									. També pots avaluar lots individuals utilitzant els botons
									específics a continuació.
								</p>
							</div>
						</div>
					</div>
				)}
		</div>
	);
}
