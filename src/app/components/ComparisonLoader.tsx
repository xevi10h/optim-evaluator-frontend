'use client';

import React from 'react';
import { Loader2, GitCompare, Users, Target, TrendingUp } from 'lucide-react';

interface ComparisonLoaderProps {
	isVisible: boolean;
	lotNumber: number;
	lotTitle: string;
	proposalCount: number;
}

export default function ComparisonLoader({
	isVisible,
	lotNumber,
	lotTitle,
	proposalCount,
}: ComparisonLoaderProps) {
	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-lg w-full">
				<div className="text-center">
					{/* Header */}
					<div className="flex items-center justify-center mb-6">
						<div className="p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
							<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
						</div>
					</div>

					<h3 className="text-xl font-bold text-gray-900 mb-2">
						Comparant Propostes
					</h3>

					<p className="text-sm text-gray-600 mb-2 font-medium">
						Lot {lotNumber}: {lotTitle}
					</p>

					<p className="text-xs text-gray-500 mb-6">
						{proposalCount} propostes a comparar
					</p>

					{/* Process Section */}
					<div className="space-y-6">
						{/* Current Process */}
						<div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
							<div className="flex items-center justify-center space-x-3 mb-4">
								<GitCompare className="h-6 w-6 text-indigo-600" />
								<div className="text-center">
									<p className="text-sm font-medium text-indigo-800">
										Anàlisi Comparatiu Intel·ligent
									</p>
									<p className="text-xs text-indigo-700">
										Comparant criteris i puntuacions
									</p>
								</div>
							</div>

							{/* AI Process */}
							<div className="flex items-center justify-center space-x-3">
								<Users className="h-5 w-5 text-purple-600" />
								<div className="text-center">
									<p className="text-sm font-medium text-purple-800">
										Generant Rànking Global
									</p>
									<p className="text-xs text-purple-700">
										Avaluant punts forts i febles
									</p>
								</div>
							</div>
						</div>

						{/* Process Steps */}
						<div className="grid grid-cols-3 gap-3">
							<div className="bg-white rounded-lg p-3 border border-indigo-200 text-center">
								<div className="flex items-center justify-center mb-2">
									<div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
										<span className="text-white text-xs font-bold">1</span>
									</div>
								</div>
								<p className="text-xs font-medium text-indigo-800">
									Comparació
								</p>
								<p className="text-xs text-indigo-600">Per criteris</p>
								<div className="mt-1">
									<Loader2 className="h-3 w-3 animate-spin text-indigo-500 mx-auto" />
								</div>
							</div>
							<div className="bg-white rounded-lg p-3 border border-purple-200 text-center">
								<div className="flex items-center justify-center mb-2">
									<div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
										<span className="text-white text-xs font-bold">2</span>
									</div>
								</div>
								<p className="text-xs font-medium text-purple-800">Rànking</p>
								<p className="text-xs text-purple-600">Global</p>
								<div className="mt-1">
									<Target className="h-3 w-3 text-purple-400 mx-auto" />
								</div>
							</div>
							<div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
								<div className="flex items-center justify-center mb-2">
									<div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
										<span className="text-white text-xs font-bold">3</span>
									</div>
								</div>
								<p className="text-xs font-medium text-blue-800">Anàlisi</p>
								<p className="text-xs text-blue-600">Detallada</p>
								<div className="mt-1">
									<TrendingUp className="h-3 w-3 text-blue-400 mx-auto" />
								</div>
							</div>
						</div>

						{/* Progress Animation */}
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full animate-pulse"
								style={{ width: '70%' }}
							></div>
						</div>
					</div>

					{/* Footer */}
					<div className="mt-6 text-center">
						<div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mb-2">
							<div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
							<div
								className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
								style={{ animationDelay: '0.3s' }}
							></div>
							<div
								className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
								style={{ animationDelay: '0.6s' }}
							></div>
						</div>
						<p className="text-sm text-gray-600">
							Analitzant diferències entre propostes
						</p>
						<p className="text-xs text-gray-500 mt-1">
							Generant comparació detallada
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
