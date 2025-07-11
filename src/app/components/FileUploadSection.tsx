// src/app/components/FileUploadSection.tsx
'use client';

import React, { useRef } from 'react';
import {
	Upload,
	FileCheck,
	FileText,
	CheckCircle,
	XCircle,
	Loader2,
	AlertTriangle,
	FileX,
} from 'lucide-react';
import type { FileWithContent } from '@/types';
import { useFileProcessing, useDragAndDrop } from '@/hooks/useFileProcessing';

interface FileUploadSectionProps {
	title: string;
	description: string;
	files: FileWithContent[];
	setFiles: (files: FileWithContent[]) => void;
	icon: 'spec' | 'proposal';
}

export default function FileUploadSection({
	title,
	description,
	files,
	setFiles,
	icon,
}: FileUploadSectionProps) {
	const fileRef = useRef<HTMLInputElement>(null);
	const processing = useFileProcessing();
	const dragDrop = useDragAndDrop();

	const handleFiles = async (selectedFiles: File[]) => {
		try {
			console.log(
				'Procesando archivos:',
				selectedFiles.map((f) => f.name),
			);

			// Determinar el tipo basado en el icono
			const type = icon === 'spec' ? 'specification' : 'proposal';

			const processedFiles = await processing.processFiles(selectedFiles, type);
			console.log('Archivos procesados:', processedFiles.length);

			setFiles([...files, ...processedFiles]);
		} catch (err) {
			console.error('Error processing files:', err);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		const droppedFiles = Array.from(e.dataTransfer.files);
		dragDrop.dragHandlers.onDrop(e, () => handleFiles(droppedFiles));
	};

	const removeFile = (index: number) => {
		setFiles(files.filter((_, i) => i !== index));
	};

	const getFileStatus = (file: FileWithContent) => {
		if (file.content.length < 100) {
			return {
				status: 'warning' as const,
				icon: (
					<AlertTriangle className="h-5 w-5" style={{ color: '#f59e0b' }} />
				),
				color: '#f59e0b',
				bgColor: '#fffbeb',
				message: 'Contenido mínimo extraído',
			};
		} else {
			return {
				status: 'success' as const,
				icon: <CheckCircle className="h-5 w-5" style={{ color: '#199875' }} />,
				color: '#199875',
				bgColor: '#dfe7e6',
				message: 'Procesado correctamente',
			};
		}
	};

	const IconComponent = icon === 'spec' ? FileCheck : FileText;

	return (
		<div>
			<h4 className="text-md font-medium mb-4" style={{ color: '#1c1c1c' }}>
				{title}
			</h4>

			<div
				className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-opacity-80 transition-colors cursor-pointer ${
					dragDrop.isDragging ? 'border-blue-500 bg-blue-50' : ''
				}`}
				style={{
					borderColor: dragDrop.isDragging ? '#3b82f6' : '#949494',
				}}
				{...dragDrop.dragHandlers}
				onDrop={handleDrop}
				onClick={() => fileRef.current?.click()}
			>
				<IconComponent
					className="mx-auto h-12 w-12 mb-4"
					style={{ color: '#949494' }}
				/>
				<p className="mb-2" style={{ color: '#6f6f6f' }}>
					Arrastra archivos aquí o haz clic para seleccionar
				</p>
				<p className="text-sm" style={{ color: '#949494' }}>
					{description}
				</p>

				{/* Información mejorada */}
				<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-left">
					<p className="text-xs text-green-800">
						✅ <strong>Procesamiento mejorado:</strong> Los archivos se procesan
						en el servidor para mejor compatibilidad y extracción de texto más
						precisa.
					</p>
				</div>
			</div>

			<input
				ref={fileRef}
				type="file"
				multiple
				accept=".pdf,.doc,.docx,.txt"
				onChange={(e) =>
					e.target.files && handleFiles(Array.from(e.target.files))
				}
				className="hidden"
			/>

			{/* Indicador de progreso mejorado */}
			{processing.isProcessing && (
				<div
					className="mt-4 p-4 rounded-lg"
					style={{ backgroundColor: '#f3f4f6' }}
				>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium" style={{ color: '#1c1c1c' }}>
							<Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
							{processing.currentFile || 'Procesando archivos...'}
						</span>
						<span className="text-sm" style={{ color: '#6f6f6f' }}>
							{Math.round(processing.progress)}%
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="h-2 rounded-full transition-all duration-300"
							style={{
								backgroundColor: '#199875',
								width: `${processing.progress}%`,
							}}
						></div>
					</div>
				</div>
			)}

			{/* Lista de archivos mejorada */}
			{files.length > 0 && (
				<div className="mt-4 space-y-3">
					{files.map((file, index) => {
						const fileStatus = getFileStatus(file);

						return (
							<div
								key={index}
								className="border rounded-lg p-4"
								style={{
									backgroundColor: fileStatus.bgColor,
									borderColor: fileStatus.color + '40',
								}}
							>
								<div className="flex items-start justify-between">
									<div className="flex items-start space-x-3 flex-1">
										{fileStatus.icon}
										<div className="flex-1">
											<div className="flex items-center justify-between">
												<span
													className="text-sm font-medium"
													style={{ color: '#1c1c1c' }}
												>
													{file.name}
												</span>
												<button
													onClick={() => removeFile(index)}
													className="text-red-600 hover:text-red-800 ml-2"
												>
													<XCircle className="h-4 w-4" />
												</button>
											</div>

											<p
												className="text-xs mt-1"
												style={{ color: fileStatus.color }}
											>
												{fileStatus.message} •{' '}
												{file.content.length.toLocaleString()} caracteres
											</p>

											{/* Preview del contenido */}
											<div className="mt-2">
												<div className="bg-white border rounded p-2">
													<p className="text-xs text-gray-600">
														Preview: {file.content.substring(0, 200)}
														{file.content.length > 200 ? '...' : ''}
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Error display mejorado */}
			{processing.error && (
				<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<div className="flex items-start space-x-2">
						<AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
						<div>
							<p className="text-sm font-medium text-red-800">
								Error procesando archivos
							</p>
							<p className="text-sm text-red-600 mt-1 whitespace-pre-line">
								{processing.error}
							</p>
							<button
								onClick={processing.clearError}
								className="mt-2 text-xs text-red-700 hover:text-red-900 underline"
							>
								Cerrar mensaje
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
