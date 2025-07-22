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
						{/* Main Process Display */}
						<div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8 border border-indigo-200">
							<div className="text-center space-y-4">
								{/* Primary Icon with Animation */}
								<div className="flex items-center justify-center">
									<div className="p-4 bg-white rounded-full shadow-sm">
										<GitCompare className="h-8 w-8 text-indigo-600 animate-pulse" />
									</div>
								</div>

								{/* Main Message */}
								<div>
									<p className="text-lg font-semibold text-indigo-800 mb-2">
										Anàlisi Comparatiu Intel·ligent
									</p>
									<p className="text-sm text-indigo-700">
										Comparant propostes i generant rànking global
									</p>
								</div>

								{/* Secondary Icons */}
								<div className="flex items-center justify-center space-x-8 pt-4">
									<div className="text-center">
										<Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
										<p className="text-xs text-purple-700">Empreses</p>
									</div>
									<div className="text-center">
										<Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
										<p className="text-xs text-blue-700">Criteris</p>
									</div>
									<div className="text-center">
										<TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
										<p className="text-xs text-green-700">Anàlisi</p>
									</div>
								</div>
							</div>
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
