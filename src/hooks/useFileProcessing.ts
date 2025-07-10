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

			setState({
				isProcessing: true,
				currentFile: null,
				error: null,
				progress: 0,
			});

			try {
				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					const fileInfo = getFileInfo(file);

					// Actualizar progreso
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
						console.log(
							`Procesando archivo ${i + 1}/${files.length}: ${file.name}`,
						);

						// Procesar archivo con timeout más largo
						const content = await Promise.race([
							processFile(file),
							new Promise<never>((_, reject) =>
								setTimeout(
									() => reject(new Error('Timeout procesando archivo')),
									60000,
								),
							),
						]);

						console.log(
							`Archivo procesado: ${file.name}, contenido: ${content.length} caracteres`,
						);

						processedFiles.push({
							file,
							content,
							name: file.name,
						});
					} catch (fileError) {
						console.error(`Error procesando ${file.name}:`, fileError);

						// Si es el único archivo, mostrar error pero continuar
						if (files.length === 1) {
							// En lugar de fallar completamente, crear un placeholder
							processedFiles.push({
								file,
								content: `[Error procesando ${file.name}]: ${
									fileError instanceof Error
										? fileError.message
										: 'Error desconegut'
								}. Si us plau, prova amb un altre format o verifica que l'arxiu no estigui corrupte.`,
								name: file.name,
							});
						} else {
							// Continuar con placeholder para múltiples archivos
							processedFiles.push({
								file,
								content: `[Error procesando ${file.name}]: ${
									fileError instanceof Error
										? fileError.message
										: 'Error desconegut'
								}`,
								name: file.name,
							});
						}
					}
				}

				setState((prev) => ({ ...prev, progress: 100 }));
				return processedFiles;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconegut';
				setState({
					isProcessing: false,
					currentFile: null,
					error: errorMessage,
					progress: 0,
				});
				throw error;
			} finally {
				// Limpiar estado después de mostrar progreso completo
				setTimeout(() => {
					setState((prev) => ({
						...prev,
						isProcessing: false,
						currentFile: null,
						progress: 0,
					}));
				}, 1000);
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

// Hook para drag and drop mejorado
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

			// Filtrar solo archivos soportados
			const supportedFiles = files.filter((file) => {
				const fileInfo = getFileInfo(file);
				return fileInfo.isSupported;
			});

			if (supportedFiles.length === 0) {
				console.warn('No se encontraron archivos soportados');
				return;
			}

			onDrop(supportedFiles);
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

// Funciones utilitarias
export function formatProgress(progress: number): string {
	return `${Math.round(progress)}%`;
}

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

export function getFileStatusColor(hasError: boolean): string {
	return hasError ? '#dc2626' : '#199875';
}
