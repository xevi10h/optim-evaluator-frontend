import { useState, useCallback } from 'react';
import type { FileWithContent, ProcessingState } from '@/types';

interface UploadResponse {
	success: boolean;
	files: Array<{
		name: string;
		content: string;
		type: 'specification' | 'proposal';
		success: boolean;
		extractedLength?: number;
		requiresManualInput?: boolean;
		error?: string;
	}>;
	summary: {
		total: number;
		successful?: number;
		processed?: number;
		failed: number;
		requireManualInput?: number;
	};
	error?: string;
}

export function useFileProcessing() {
	const [state, setState] = useState<ProcessingState>({
		isProcessing: false,
		currentFile: null,
		error: null,
		progress: 0,
	});

	const processFiles = useCallback(
		async (
			files: File[],
			type: 'specification' | 'proposal',
		): Promise<FileWithContent[]> => {
			setState({
				isProcessing: true,
				currentFile: null,
				error: null,
				progress: 0,
			});

			try {
				const formData = new FormData();

				files.forEach((file) => {
					formData.append('files', file);
				});

				formData.append('type', type);

				setState((prev) => ({
					...prev,
					progress: 25,
					currentFile: `Pujant ${files.length} arxiu(s)...`,
				}));

				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData,
				});

				setState((prev) => ({
					...prev,
					progress: 75,
					currentFile: 'Processant arxius...',
				}));

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.error || `Error del servidor: ${response.status}`,
					);
				}

				const result: UploadResponse = await response.json();

				setState((prev) => ({
					...prev,
					progress: 100,
					currentFile: 'Completat',
				}));

				const processedFiles: FileWithContent[] = result.files
					.filter((file) => file.success)
					.map((file) => ({
						file: files.find((f) => f.name === file.name)!,
						content: file.content,
						name: file.name,
					}));

				const manualFiles = result.files.filter(
					(file) => file.requiresManualInput,
				);
				const failedFiles = result.files.filter((file) => !file.success);

				let errorMessage = '';

				if (manualFiles.length > 0) {
					errorMessage += `📋 ${manualFiles.length} arxiu(s) requereixen processament manual:\n`;
					errorMessage += manualFiles.map((f) => `- ${f.name}`).join('\n');
					errorMessage += '\nRevisa les instruccions en el contingut extret.';
				}

				if (failedFiles.length > 0) {
					if (errorMessage) errorMessage += '\n\n';
					errorMessage += `❌ ${failedFiles.length} arxiu(s) no s'han pogut processar:\n`;
					errorMessage += failedFiles
						.map((f) => `- ${f.name}: ${f.error}`)
						.join('\n');
				}

				if (errorMessage) {
					setState((prev) => ({
						...prev,
						error: errorMessage,
					}));
				}

				console.log(
					`✅ Processats ${processedFiles.length}/${files.length} arxius correctament`,
				);

				return processedFiles;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconegut';
				console.error('❌ Error en el processament:', errorMessage);

				setState({
					isProcessing: false,
					currentFile: null,
					error: `Error processant arxius: ${errorMessage}`,
					progress: 0,
				});
				throw error;
			} finally {
				setTimeout(() => {
					setState((prev) => ({
						...prev,
						isProcessing: false,
						currentFile: null,
						progress: 0,
					}));
				}, 2000);
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

			const supportedFiles = files.filter((file) => {
				const supportedTypes = [
					'application/pdf',
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					'application/msword',
					'text/plain',
				];
				return (
					supportedTypes.includes(file.type) ||
					file.name.toLowerCase().endsWith('.pdf') ||
					file.name.toLowerCase().endsWith('.docx') ||
					file.name.toLowerCase().endsWith('.doc') ||
					file.name.toLowerCase().endsWith('.txt')
				);
			});

			if (supportedFiles.length === 0) {
				console.warn("No s'han trobat arxius suportats");
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
