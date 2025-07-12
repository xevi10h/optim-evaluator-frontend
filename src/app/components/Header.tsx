'use client';

import React from 'react';
import { Building } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
	return (
		<header
			className="bg-white shadow-sm border-b"
			style={{ borderColor: '#dfe7e6' }}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center py-6">
					<div className="flex items-center space-x-4">
						<Image
							src="/optim-people-logo.png"
							alt="Optim People Logo"
							width={145}
							height={40}
							priority
						/>
						<div>
							<h1 className="text-2xl font-bold" style={{ color: '#1c1c1c' }}>
								Optim Evaluator
							</h1>
							<p className="text-sm" style={{ color: '#6f6f6f' }}>
								Sistema d'Avaluació de Licitacions
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
