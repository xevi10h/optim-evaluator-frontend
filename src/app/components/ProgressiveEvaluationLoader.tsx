'use client';

import React from 'react';
import { Loader2, Brain, Package, CheckCircle } from 'lucide-react';

interface ProgressiveEvaluationLoaderProps {
	isVisible: boolean;
	currentLot: number;
	totalLots: number;
	currentLotTitle: string;
}

export default function ProgressiveEvaluationLoader({
	isVisible,
	currentLot,
	totalLots,
	currentLotTitle,
}: ProgressiveEvaluationLoaderProps) {
	if (!isVisible) return null;

	const progressPercentage = totalLots > 0 ? (currentLot / totalLots) * 100 : 0;
	const isLastLot = currentLot === totalLots;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-lg w-full">
				<div className="text-center">
					{/* Header */}
					<div className="flex items-center justify-center mb-6">
						<div className="p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
							<Loader2 className="h-8 w-8 animate-spin text-green-600" />
						</div>
					</div>

					<h3 className="text-xl font-bold text-gray-900 mb-2">
						Avaluant Licitació
					</h3>

					<p className="text-sm text-gray-600 mb-6">
						Processament lot per lot amb intel·ligència artificial
					</p>

					{/* Progress Section */}
					<div className="space-y-6">
						{/* Main Progress Bar */}
						<div className="w-full bg-gray-200 rounded-full h-3">
							<div
								className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
								style={{ width: `${progressPercentage}%` }}
							></div>
						</div>

						{/* Lot Progress Info */}
						<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
							<div className="flex items-center justify-center space-x-3 mb-4">
								<Package className="h-6 w-6 text-green-600" />
								<div className="text-center">
									<p className="text-sm font-medium text-green-800">
										{currentLot > 0
											? `Lot ${currentLot} de ${totalLots}`
											: 'Iniciant avaluació...'}
									</p>
									{currentLotTitle && (
										<p className="text-xs text-green-700 mt-1 max-w-sm truncate">
											{currentLotTitle}
										</p>
									)}
								</div>
							</div>

							{/* Current Process */}
							<div className="flex items-center justify-center space-x-3">
								<Brain className="h-5 w-5 text-blue-600" />
								<div className="text-center">
									<p className="text-sm font-medium text-blue-800">
										{currentLot === 0
											? 'Preparant avaluació...'
											: isLastLot
											? 'Completant avaluació final...'
											: 'Extraient criteris i avaluant propostes'}
									</p>
									<p className="text-xs text-blue-700">
										IA especialitzada en licitacions públiques
									</p>
								</div>
							</div>
						</div>

						{/* Process Steps */}
						<div className="grid grid-cols-2 gap-4">
							<div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
								<div className="flex items-center justify-center mb-2">
									{currentLot > 0 ? (
										<CheckCircle className="h-5 w-5 text-green-500" />
									) : (
										<div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
									)}
								</div>
								<p className="text-xs font-medium text-gray-700">
									Extracció de Criteris
								</p>
							</div>
							<div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
								<div className="flex items-center justify-center mb-2">
									{currentLot > 0 ? (
										<Loader2 className="h-5 w-5 animate-spin text-blue-500" />
									) : (
										<div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
									)}
								</div>
								<p className="text-xs font-medium text-gray-700">
									Avaluació de Propostes
								</p>
							</div>
						</div>

						{/* Lot Counter */}
						{totalLots > 1 && (
							<div className="flex justify-center space-x-2">
								{Array.from({ length: totalLots }, (_, i) => (
									<div
										key={i}
										className={`w-3 h-3 rounded-full transition-all duration-300 ${
											i < currentLot
												? 'bg-green-500 scale-110'
												: i === currentLot - 1
												? 'bg-blue-500 animate-pulse scale-110'
												: 'bg-gray-300'
										}`}
									></div>
								))}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="mt-6 text-center">
						<div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mb-2">
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
						<p className="text-sm text-gray-600">
							{totalLots > 1
								? `Avaluant ${totalLots} lots seqüencialment...`
								: 'Processat en curs...'}
						</p>
						<p className="text-xs text-gray-500 mt-1">
							Aquest procés és més eficient i precís
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
