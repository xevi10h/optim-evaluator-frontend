'use client';

import React from 'react';
import { Loader2, Brain, Package, CheckCircle } from 'lucide-react';

interface SingleLotEvaluationLoaderProps {
	isVisible: boolean;
	lotNumber: number;
	lotTitle: string;
}

export default function SingleLotEvaluationLoader({
	isVisible,
	lotNumber,
	lotTitle,
}: SingleLotEvaluationLoaderProps) {
	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full">
				<div className="text-center">
					{/* Header */}
					<div className="flex items-center justify-center mb-6">
						<div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
							<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
						</div>
					</div>

					<h3 className="text-xl font-bold text-gray-900 mb-2">
						Avaluant Lot {lotNumber}
					</h3>

					<p className="text-sm text-gray-600 mb-6 leading-relaxed">
						{lotTitle}
					</p>

					{/* Process Section */}
					<div className="space-y-6">
						{/* Current Process */}
						<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
							<div className="flex items-center justify-center space-x-3 mb-4">
								<Package className="h-6 w-6 text-blue-600" />
								<div className="text-center">
									<p className="text-sm font-medium text-blue-800">
										Avaluació en Procés
									</p>
									<p className="text-xs text-blue-700">
										Criteris extrets - Avaluant propostes
									</p>
								</div>
							</div>

							{/* AI Process */}
							<div className="flex items-center justify-center space-x-3">
								<Brain className="h-5 w-5 text-purple-600" />
								<div className="text-center">
									<p className="text-sm font-medium text-purple-800">
										Intel·ligència Artificial Especialitzada
									</p>
									<p className="text-xs text-purple-700">
										Anàlisi profund de cada criteri
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="mt-6 text-center">
						<div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mb-2">
							<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
							<div
								className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
								style={{ animationDelay: '0.3s' }}
							></div>
							<div
								className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
								style={{ animationDelay: '0.6s' }}
							></div>
						</div>
						<p className="text-sm text-gray-600">
							Avaluació personalitzada per aquest lot
						</p>
						<p className="text-xs text-gray-500 mt-1">
							Processant cada criteri amb IA
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
