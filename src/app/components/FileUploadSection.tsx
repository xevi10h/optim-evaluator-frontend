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
	Copy,
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
			const processedFiles = await processing.processFiles(selectedFiles);
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

	const copyPlaceholderText = (content: string) => {
		navigator.clipboard.writeText(content).then(() => {
			console.log('Texto copiado al portapapeles');
		});
	};

	const isPlaceholder = (content: string) => {
		return (
			content.includes('[PDF:') &&
			content.includes('IMPORTANTE: Este PDF no se pudo procesar')
		);
	};

	const getFileStatus = (file: FileWithContent) => {
		if (isPlaceholder(file.content)) {
			return {
				status: 'error' as const,
				icon: <FileX className="h-5 w-5" style={{ color: '#dc2626' }} />,
				color: '#dc2626',
				bgColor: '#fef2f2',
				message: 'Error al procesar PDF',
			};
		} else if (file.content.length < 100) {
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

				{/* Mensaje adicional para PDFs */}
				<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
					<p className="text-xs text-blue-800">
						💡 <strong>Para PDFs problemáticos:</strong> Si un PDF no se procesa
						correctamente, puedes copiar manualmente el texto relevante y crear
						un archivo .txt, o convertir el PDF a formato Word (.docx).
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

			{/* Indicador de progreso */}
			{processing.isProcessing && (
				<div
					className="mt-4 p-4 rounded-lg"
					style={{ backgroundColor: '#f3f4f6' }}
				>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium" style={{ color: '#1c1c1c' }}>
							<Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
							Procesando: {processing.currentFile}
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
												{fileStatus.message} • {file.content.length} caracteres
											</p>

											{/* Mostrar preview del contenido */}
											<div className="mt-2">
												{isPlaceholder(file.content) ? (
													<div className="bg-red-50 border border-red-200 rounded p-3">
														<p className="text-xs text-red-800 mb-2">
															⚠️ Este PDF no se pudo procesar automáticamente.
														</p>
														<button
															onClick={() => copyPlaceholderText(file.content)}
															className="flex items-center text-xs text-blue-600 hover:text-blue-800"
														>
															<Copy className="h-3 w-3 mr-1" />
															Copiar instrucciones
														</button>
													</div>
												) : (
													<div className="bg-white border rounded p-2">
														<p className="text-xs text-gray-600">
															Preview: {file.content.substring(0, 150)}
															{file.content.length > 150 ? '...' : ''}
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Error display */}
			{processing.error && (
				<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<div className="flex items-start space-x-2">
						<AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
						<div>
							<p className="text-sm font-medium text-red-800">
								Error procesando archivo
							</p>
							<p className="text-sm text-red-600 mt-1">{processing.error}</p>
							<div className="mt-2 text-xs text-red-700">
								<p>
									<strong>Sugerencias:</strong>
								</p>
								<ul className="list-disc list-inside mt-1 space-y-1">
									<li>Verifica que el archivo no esté protegido o cifrado</li>
									<li>Intenta convertir el PDF a formato Word (.docx)</li>
									<li>Copia manualmente el texto y crea un archivo .txt</li>
									<li>Prueba con un archivo PDF diferente</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
