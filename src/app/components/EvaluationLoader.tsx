'use client';

import React from 'react';
import { Loader2, Brain } from 'lucide-react';

interface EvaluationLoaderProps {
	isVisible: boolean;
}

export default function EvaluationLoader({ isVisible }: EvaluationLoaderProps) {
	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full">
				<div className="text-center">
					<div className="flex items-center justify-center mb-6">
						<div className="p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
							<Loader2 className="h-8 w-8 animate-spin text-green-600" />
						</div>
					</div>
					<h3 className="text-xl font-bold text-gray-900 mb-4">
						Avaluant Propostes
					</h3>
					<div className="space-y-4">
						<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
							<div className="flex items-center justify-center space-x-3">
								<Brain className="h-6 w-6 text-green-600" />
								<div>
									<p className="text-sm font-medium text-green-800">
										Analitzant amb Intel·ligència Artificial
									</p>
									<p className="text-xs text-green-700">
										Processant documents i criteris
									</p>
								</div>
							</div>
						</div>
					</div>
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
							Aquest procés pot trigar uns minuts...
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
