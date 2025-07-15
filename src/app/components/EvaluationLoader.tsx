'use client';

import React from 'react';
import { Loader2, FileText, CheckCircle, Package } from 'lucide-react';
import type { EvaluationProgress } from '@/lib/apiService';

interface EvaluationLoaderProps {
	isVisible: boolean;
	progress: EvaluationProgress | null;
}

export default function EvaluationLoader({
	isVisible,
	progress,
}: EvaluationLoaderProps) {
	console.log('EvaluationLoader render:', { isVisible, progress });

	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="flex items-center justify-center mb-4">
						<div className="p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
							<Loader2 className="h-8 w-8 animate-spin text-green-600" />
						</div>
					</div>
					<h3 className="text-xl font-bold text-gray-900 mb-2">
						Avaluant Propostes
					</h3>
					<p className="text-gray-600 text-sm">
						Analitzant els documents amb Intel·ligència Artificial
					</p>
				</div>

				{/* Progress Bar */}
				<div className="mb-6">
					<div className="flex justify-between text-sm text-gray-600 mb-2">
						<span>Progrés</span>
						<span>{progress?.progress || 0}%</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-3">
						<div
							className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
							style={{ width: `${progress?.progress || 0}%` }}
						></div>
					</div>
				</div>

				{/* Current Status */}
				{progress && (
					<div className="space-y-4">
						{/* Current Proposal Info */}
						<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-green-100 rounded-lg">
									<FileText className="h-5 w-5 text-green-600" />
								</div>
								<div className="flex-1">
									<p className="text-sm font-medium text-green-800">
										Proposta Actual
									</p>
									<p className="text-green-700 font-semibold">
										{progress.currentProposal}
									</p>
								</div>
							</div>
						</div>

						{/* Lot Info */}
						<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Package className="h-5 w-5 text-blue-600" />
								</div>
								<div className="flex-1">
									<p className="text-sm font-medium text-blue-800">
										Lot en Procés
									</p>
									<p className="text-blue-700 font-semibold">
										Lot {progress.currentLot}
									</p>
								</div>
							</div>
						</div>

						{/* Progress Counter */}
						<div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-purple-100 rounded-lg">
									<CheckCircle className="h-5 w-5 text-purple-600" />
								</div>
								<div className="flex-1">
									<p className="text-sm font-medium text-purple-800">
										Propostes Processades
									</p>
									<p className="text-purple-700 font-semibold">
										{progress.currentIndex} de {progress.totalProposals}
									</p>
								</div>
							</div>
						</div>

						{/* Status Message */}
						<div className="text-center">
							<p className="text-sm text-gray-600 italic">{progress.status}</p>
						</div>
					</div>
				)}

				{/* Footer */}
				<div className="mt-8 text-center">
					<div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
						<div
							className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
							style={{ animationDelay: '0.5s' }}
						></div>
						<div
							className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
							style={{ animationDelay: '1s' }}
						></div>
					</div>
					<p className="text-xs text-gray-500 mt-2">
						Aquest procés pot trigar uns minuts...
					</p>
				</div>
			</div>
		</div>
	);
}
