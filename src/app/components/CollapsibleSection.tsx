'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
	title: string;
	subtitle?: string;
	icon?: React.ReactNode;
	isOpenByDefault?: boolean;
	headerColor?: string;
	headerBgColor?: string;
	badgeText?: string;
	badgeColor?: string;
	customBadge?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

export default function CollapsibleSection({
	title,
	subtitle,
	icon,
	isOpenByDefault = false,
	headerColor = '#1c1c1c',
	headerBgColor = '#f8f9fa',
	badgeText,
	badgeColor = '#199875',
	customBadge,
	children,
	className = '',
}: CollapsibleSectionProps) {
	const [isOpen, setIsOpen] = useState(isOpenByDefault);

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	return (
		<div
			className={`border rounded-lg overflow-hidden transition-all duration-300 ${className}`}
			style={{ borderColor: '#dfe7e6' }}
		>
			<button
				onClick={toggleOpen}
				className="w-full px-6 py-4 flex items-center justify-between transition-all duration-200 hover:opacity-80 cursor-pointer"
				style={{ backgroundColor: headerBgColor }}
			>
				<div className="flex items-center space-x-3">
					{icon && <div className="flex-shrink-0">{icon}</div>}
					<div className="text-left">
						<h4
							className="text-lg font-semibold flex items-center space-x-3"
							style={{ color: headerColor }}
						>
							<span>{title}</span>
							{customBadge && customBadge}
							{!customBadge && badgeText && (
								<span
									className="px-3 py-1 rounded-full text-sm font-medium text-white"
									style={{ backgroundColor: badgeColor }}
								>
									{badgeText}
								</span>
							)}
						</h4>
						{subtitle && (
							<p className="text-sm mt-1" style={{ color: '#6f6f6f' }}>
								{subtitle}
							</p>
						)}
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<div
						className={`transform transition-transform duration-300 ${
							isOpen ? 'rotate-90' : 'rotate-0'
						}`}
					>
						<ChevronRight className="h-5 w-5" style={{ color: headerColor }} />
					</div>
				</div>
			</button>

			<div
				className={`transition-all duration-500 ease-in-out overflow-hidden ${
					isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
				}`}
				style={{
					maxHeight: isOpen ? 'none' : '0',
				}}
			>
				<div className="border-t" style={{ borderColor: '#dfe7e6' }}>
					<div
						className={`transform transition-all duration-300 ${
							isOpen ? 'translate-y-0' : '-translate-y-4'
						}`}
					>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
