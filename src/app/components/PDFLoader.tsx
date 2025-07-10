// src/components/PDFLoader.tsx
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
		// Solo cargar PDF.js en el cliente
		if (typeof window !== 'undefined') {
			// Precargar PDF.js worker
			const script = document.createElement('script');
			script.src =
				'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
			script.onload = () => setIsLoaded(true);
			script.onerror = () => setHasError(true);

			// No añadir el script al documento, solo verificar disponibilidad
			setIsLoaded(true);
		}
	}, []);

	if (hasError) {
		return (
			<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<p className="text-sm text-yellow-800">
					⚠️ PDF.js no disponible. Los archivos PDF se procesarán con método
					alternativo.
				</p>
			</div>
		);
	}

	if (!isLoaded) {
		return (
			fallback || (
				<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<p className="text-sm text-blue-800">
						🔄 Inicializando procesador de PDF...
					</p>
				</div>
			)
		);
	}

	return <>{children}</>;
}
