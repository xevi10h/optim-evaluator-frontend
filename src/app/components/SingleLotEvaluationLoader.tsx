'use client';

import React from 'react';
import { Loader2, Package } from 'lucide-react';

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
					<div className="flex items-center justify-center mb-6">
						<div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
							<Loader2 className="h-12 w-12 animate-spin text-blue-600" />
						</div>
					</div>

					<h3 className="text-xl font-bold text-gray-900 mb-2">
						Avaluant Lot {lotNumber}
					</h3>

					{lotTitle && (
						<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 mb-6">
							<div className="flex items-center justify-center space-x-3">
								<Package className="h-8 w-8 text-blue-600" />
								<p className="text-sm font-medium text-blue-800 leading-relaxed">
									{lotTitle}
								</p>
							</div>
						</div>
					)}

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

					<p className="text-sm text-gray-600">Analitzant propostes amb IA</p>
				</div>
			</div>
		</div>
	);
}
