'use client';

import React from 'react';
import { Shield, Building } from 'lucide-react';

export default function Header() {
	return (
		<header
			className="bg-white shadow-sm border-b"
			style={{ borderColor: '#dfe7e6' }}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center py-6">
					<div className="flex items-center space-x-3">
						<div
							className="p-2 rounded-lg"
							style={{ backgroundColor: '#199875' }}
						>
							<Shield className="h-8 w-8 text-white" />
						</div>
						<div>
							<h1 className="text-2xl font-bold" style={{ color: '#1c1c1c' }}>
								OptimEvaluator
							</h1>
							<p className="text-sm" style={{ color: '#6f6f6f' }}>
								Sistema d'Avaluació de Licitacions amb IA
							</p>
						</div>
					</div>
					<div
						className="flex items-center space-x-2 text-sm"
						style={{ color: '#6f6f6f' }}
					>
						<Building className="h-4 w-4" />
						<span>Optim People</span>
					</div>
				</div>
			</div>
		</header>
	);
}
