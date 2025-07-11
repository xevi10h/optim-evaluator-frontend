'use client';

import { useEffect, useState } from 'react';

interface PDFLoaderProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export default function PDFLoader({ children, fallback }: PDFLoaderProps) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			setIsLoaded(true);
		}
	}, []);

	if (hasError) {
		return (
			<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<p className="text-sm text-yellow-800">
					⚠️ El processador de PDF no està disponible. S'utilitzarà un mètode
					alternatiu.
				</p>
			</div>
		);
	}

	if (!isLoaded) {
		return (
			fallback || (
				<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<p className="text-sm text-blue-800">
						🔄 Inicialitzant processador de PDF...
					</p>
				</div>
			)
		);
	}

	return <>{children}</>;
}
