// src/app/components/LotEvaluationButtons.tsx - Individual lot evaluation controls
'use client';

import React from 'react';
import {
	Package,
	Play,
	CheckCircle,
	Loader2,
	AlertTriangle,
} from 'lucide-react';
import type { LotInfo } from '@/types';

interface LotEvaluationStatus {
	lotNumber: number;
	isEvaluated: boolean;
	isEvaluating: boolean;
	evaluations: any[];
	hasProposals: boolean;
	proposalCount: number;
}

interface LotEvaluationButtonsProps {
	lots: LotInfo[];
	lotStatuses: Map<number, LotEvaluationStatus>;
	onEvaluateLot: (lot: LotInfo) => void;
	isFormValid: boolean;
	currentEvaluatingLot: number | null;
}

export default function LotEvaluationButtons({
	lots,
	lotStatuses,
	onEvaluateLot,
	isFormValid,
	currentEvaluatingLot,
}: LotEvaluationButtonsProps) {
	const lotsWithProposals = lots.filter((lot) => {
		const status = lotStatuses.get(lot.lotNumber);
		return status?.hasProposals;
	});

	if (lotsWithProposals.length === 0) {
		return null;
	}

	return (
		<div className="mt-6 space-y-4">
			<div className="flex items-center space-x-2">
				<Package className="h-5 w-5 text-gray-600" />
				<h4 className="text-md font-medium text-gray-800">
					Avaluació Individual per Lots
				</h4>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{lotsWithProposals.map((lot) => {
					const status = lotStatuses.get(lot.lotNumber);
					const isCurrentlyEvaluating = currentEvaluatingLot === lot.lotNumber;
					const isAnyLotEvaluating = currentEvaluatingLot !== null;
					const isDisabled = !isFormValid || isAnyLotEvaluating || false;

					return (
						<div
							key={lot.lotNumber}
							className={`border rounded-lg p-4 transition-all duration-200 ${
								status?.isEvaluated
									? 'bg-green-50 border-green-200'
									: 'bg-white border-gray-200 hover:border-gray-300'
							}`}
						>
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1">
									<div className="flex items-center space-x-2 mb-1">
										<span className="font-semibold text-gray-800">
											Lot {lot.lotNumber}
										</span>
										{status?.isEvaluated && (
											<CheckCircle className="h-4 w-4 text-green-500" />
										)}
									</div>
									<p className="text-sm text-gray-600 line-clamp-2">
										{lot.title}
									</p>
									{status && (
										<p className="text-xs text-gray-500 mt-1">
											{status.proposalCount} proposta
											{status.proposalCount > 1 ? 'es' : ''}
											{status.isEvaluated &&
												` • ${status.evaluations.length} avaluació${
													status.evaluations.length > 1 ? 'ns' : ''
												}`}
										</p>
									)}
								</div>
							</div>

							<div className="flex items-center justify-between">
								{status?.isEvaluated ? (
									<div className="flex items-center space-x-2 text-green-600">
										<CheckCircle className="h-4 w-4" />
										<span className="text-sm font-medium">Avaluat</span>
									</div>
								) : (
									<button
										onClick={() => onEvaluateLot(lot)}
										disabled={isDisabled}
										className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
											isDisabled
												? 'bg-gray-100 text-gray-400 cursor-not-allowed'
												: 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer transform hover:scale-105'
										}`}
									>
										{isCurrentlyEvaluating ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												<span>Avaluant...</span>
											</>
										) : (
											<>
												<Play className="h-4 w-4" />
												<span>Avaluar Lot</span>
											</>
										)}
									</button>
								)}
							</div>

							{/* Progress indicator when evaluating */}
							{isCurrentlyEvaluating && (
								<div className="mt-3">
									<div className="w-full bg-gray-200 rounded-full h-1">
										<div
											className="bg-blue-500 h-1 rounded-full animate-pulse"
											style={{ width: '60%' }}
										></div>
									</div>
									<p className="text-xs text-blue-600 mt-1">
										Processant amb IA...
									</p>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Summary info */}
			<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
				<div className="flex items-start space-x-3">
					<div className="p-1 bg-blue-100 rounded">
						<AlertTriangle className="h-4 w-4 text-blue-600" />
					</div>
					<div className="flex-1">
						<h5 className="text-sm font-medium text-blue-800 mb-1">
							Avaluació Individual
						</h5>
						<p className="text-xs text-blue-700 leading-relaxed">
							Pots avaluar cada lot per separat segons les teves necessitats.
							{lots.length > lotsWithProposals.length && (
								<>
									{' '}
									{lots.length - lotsWithProposals.length} lot
									{lots.length - lotsWithProposals.length > 1
										? 's no han rebut'
										: ' no ha rebut'}{' '}
									propostes i s'ometrà automàticament.
								</>
							)}
						</p>
						{lotsWithProposals.length > 1 && (
							<p className="text-xs text-blue-600 mt-1 font-medium">
								💡 Consell: Avalua primer els lots més crítics o urgents
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
