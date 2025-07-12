'use client';

import React, { useState } from 'react';

interface TooltipProps {
	content: string;
	children: React.ReactNode;
	position?: 'top' | 'bottom' | 'left' | 'right';
	className?: string;
}

export default function Tooltip({
	content,
	children,
	position = 'top',
	className = '',
}: TooltipProps) {
	const [isVisible, setIsVisible] = useState(false);

	const positionClasses = {
		top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-3',
		bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-3',
		left: 'right-full top-1/2 transform -translate-y-1/2 mr-3',
		right: 'left-full top-1/2 transform -translate-y-1/2 ml-3',
	};

	const arrowClasses = {
		top: 'absolute top-full left-1/2 transform -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900',
		bottom:
			'absolute bottom-full left-1/2 transform -translate-x-1/2 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-gray-900',
		left: 'absolute left-full top-1/2 transform -translate-y-1/2 border-t-[6px] border-b-[6px] border-l-[6px] border-transparent border-l-gray-900',
		right:
			'absolute right-full top-1/2 transform -translate-y-1/2 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-gray-900',
	};

	return (
		<div
			className={`relative inline-block cursor-help ${className}`}
			onMouseEnter={() => setIsVisible(true)}
			onMouseLeave={() => setIsVisible(false)}
			role="tooltip"
			aria-label={content}
		>
			{children}
			{isVisible && (
				<div
					className={`absolute ${positionClasses[position]} z-[9999] px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none`}
					style={{
						fontSize: '10px',
						lineHeight: '1.5',
						whiteSpace: 'normal',
						wordWrap: 'break-word',
						maxWidth: '600px',
						minWidth: '300px',
						boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
					}}
				>
					{content}
					<div className={arrowClasses[position]}></div>
				</div>
			)}
		</div>
	);
}
