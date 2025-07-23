'use client';

import React from 'react';
import { User, RotateCcw } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
	onReset?: () => void;
}

export default function Header({ onReset }: HeaderProps) {
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
								Evaluador d'ofertes de Licitacions
							</h1>
							<p className="text-sm" style={{ color: '#6f6f6f' }}>
								Sistema potenciat amb IA per a l'Avaluació de Licitacions
							</p>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						{onReset && (
							<button
								onClick={onReset}
								className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 text-white cursor-pointer hover:shadow-md"
								style={{
									background:
										'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background =
										'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background =
										'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
								}}
								title="Reseteja la pàgina per començar una nova avaluació"
							>
								<RotateCcw className="h-4 w-4" />
								<span>Nova licitació</span>
							</button>
						)}
						<div
							className="flex items-center space-x-2 text-sm"
							style={{ color: '#6f6f6f' }}
						>
							<User className="h-4 w-4" />
							<span>Admin</span>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
