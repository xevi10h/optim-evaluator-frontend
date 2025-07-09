// src/hooks/useFileProcessing.ts
import { useState, useCallback } from 'react';
import {
	processFile,
	getFileInfo,
	validateExtractedContent,
} from '@/lib/pdfProcessor';
import { APP_CONFIG } from '@/lib/config';
import type { FileWithContent, ProcessingState } from '@/types';

export function useFileProcessing() {
	const [state, setState] = useState<ProcessingState>({
		isProcessing: false,
		currentFile: null,
		error: null,
		progress: 0,
	});

	const processFiles = useCallback(
		async (files: File[]): Promise<FileWithContent[]> => {
			const processedFiles: FileWithContent[] = [];

			setState((prev) => ({
				...prev,
				isProcessing: true,
				error: null,
				progress: 0,
			}));

			try {
				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					const fileInfo = getFileInfo(file);

					// Actualizar estado
					setState((prev) => ({
						...prev,
						currentFile: file.name,
						progress: (i / files.length) * 100,
					}));

					// Validar archivo
					if (!fileInfo.isSupported) {
						throw new Error(`Tipus d'arxiu no suportat: ${file.name}`);
					}

					if (file.size > APP_CONFIG.files.maxSize) {
						throw new Error(
							`L'arxiu ${file.name} supera el límit de ${
								APP_CONFIG.files.maxSize / 1024 / 1024
							}MB`,
						);
					}

					try {
						// Procesar archivo
						const content = await processFile(file);

						// Validar contenido
						if (!validateExtractedContent(content, file.name)) {
							console.warn(
								`Contenido insuficiente en ${file.name}, pero continuando...`,
							);
						}

						processedFiles.push({
							file,
							content,
							name: file.name,
						});
					} catch (fileError) {
						console.error(`Error procesando ${file.name}:`, fileError);

						// Decidir si continuar o fallar
						if (files.length === 1) {
							throw fileError; // Si es el único archivo, fallar
						} else {
							// Si hay múltiples archivos, continuar con un contenido de error
							processedFiles.push({
								file,
								content: `[Error procesando ${file.name}: ${
									fileError instanceof Error
										? fileError.message
										: 'Error desconegut'
								}]`,
								name: file.name,
							});
						}
					}
				}

				setState((prev) => ({ ...prev, progress: 100 }));
				return processedFiles;
			} catch (error) {
				setState((prev) => ({
					...prev,
					error: error instanceof Error ? error.message : 'Error desconegut',
					isProcessing: false,
					currentFile: null,
					progress: 0,
				}));
				throw error;
			} finally {
				setTimeout(() => {
					setState((prev) => ({
						...prev,
						isProcessing: false,
						currentFile: null,
						progress: 0,
					}));
				}, 500);
			}
		},
		[],
	);

	const clearError = useCallback(() => {
		setState((prev) => ({ ...prev, error: null }));
	}, []);

	const reset = useCallback(() => {
		setState({
			isProcessing: false,
			currentFile: null,
			error: null,
			progress: 0,
		});
	}, []);

	return {
		...state,
		processFiles,
		clearError,
		reset,
	};
}

// Hook para drag and drop
export function useDragAndDrop() {
	const [isDragging, setIsDragging] = useState(false);
	const [dragCounter, setDragCounter] = useState(0);

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragCounter((prev) => prev + 1);
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragCounter((prev) => {
			const newCounter = prev - 1;
			if (newCounter === 0) {
				setIsDragging(false);
			}
			return newCounter;
		});
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent, onDrop: (files: File[]) => void) => {
			e.preventDefault();
			e.stopPropagation();

			setIsDragging(false);
			setDragCounter(0);

			const files = Array.from(e.dataTransfer.files);
			onDrop(files);
		},
		[],
	);

	return {
		isDragging,
		dragHandlers: {
			onDragEnter: handleDragEnter,
			onDragLeave: handleDragLeave,
			onDragOver: handleDragOver,
			onDrop: handleDrop,
		},
	};
}

// Función utilitaria para formatear el progreso
export function formatProgress(progress: number): string {
	return `${Math.round(progress)}%`;
}

// Función para obtener el icono del archivo
export function getFileTypeIcon(filename: string): string {
	const ext = filename.toLowerCase().split('.').pop();

	switch (ext) {
		case 'pdf':
			return '📄';
		case 'docx':
		case 'doc':
			return '📝';
		case 'txt':
			return '📄';
		default:
			return '📄';
	}
}

// Función para obtener el color del archivo según su estado
export function getFileStatusColor(hasError: boolean): string {
	return hasError ? '#dc2626' : '#199875';
}
