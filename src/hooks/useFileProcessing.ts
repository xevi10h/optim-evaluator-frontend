import { useState, useCallback } from 'react';
import { apiService } from '@/lib/apiService';
import type { FileWithContent, ProcessingState } from '@/types';

interface ProcessedFile {
	name: string;
	content: string;
	type: 'specification' | 'proposal';
	success: boolean;
	extractedLength?: number;
	error?: string;
}

interface UploadResponse {
	success: boolean;
	files: ProcessedFile[];
	summary: {
		total: number;
		successful: number;
		failed: number;
	};
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
				setState((prev) => ({
					...prev,
					progress: 25,
					currentFile: `Enviant ${files.length} document(s) al servidor...`,
				}));

				// Use the new API service
				const result: UploadResponse = await apiService.uploadFiles(
					files,
					type,
				);

				setState((prev) => ({
					...prev,
					progress: 75,
					currentFile: `Processant ${result.summary.successful} document(s)...`,
				}));

				setState((prev) => ({
					...prev,
					progress: 100,
					currentFile: `Processament completat: ${result.summary.successful} document(s) processats amb èxit.`,
				}));

				// Convert processed files to the format expected by the frontend
				const processedFiles: FileWithContent[] = result.files
					.filter((file) => file.success)
					.map((file) => ({
						file: files.find((f) => f.name === file.name)!,
						content: file.content,
						name: file.name,
					}));

				// Handle failed files
				const failedFiles = result.files.filter((file) => !file.success);

				let errorMessage = '';

				if (failedFiles.length > 0) {
					errorMessage += `❌ ${failedFiles.length} documents(s) no han pogut ser processats:\n`;
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
					`✅ Processats ${processedFiles.length}/${files.length} documents correctament.`,
				);

				return processedFiles;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconegut';
				console.error('❌ Error en el processament:', errorMessage);

				setState({
					isProcessing: false,
					currentFile: null,
					error: `Error processant documents: ${errorMessage}`,
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

// Keep the drag and drop hook without changes
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
				console.warn("No s'han trobat fitxers vàlids per processar.");
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
