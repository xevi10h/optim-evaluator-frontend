'use client';

import React, { useRef } from 'react';
import {
	Upload,
	FileCheck,
	FileText,
	CheckCircle,
	XCircle,
	Loader2,
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
			const processedFiles = await processing.processFiles(selectedFiles);
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
					Arrossega arxius aquí o fes clic per seleccionar
				</p>
				<p className="text-sm" style={{ color: '#949494' }}>
					{description}
				</p>
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
							Processant: {processing.currentFile}
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

			{/* Lista de archivos */}
			{files.length > 0 && (
				<div className="mt-4 space-y-2">
					{files.map((file, index) => (
						<div
							key={index}
							className="flex items-center justify-between p-3 rounded-lg"
							style={{ backgroundColor: '#dfe7e6' }}
						>
							<div className="flex items-center">
								<CheckCircle
									className="h-5 w-5 mr-2"
									style={{ color: '#199875' }}
								/>
								<span
									className="text-sm font-medium"
									style={{ color: '#1c1c1c' }}
								>
									{file.name}
								</span>
							</div>
							<button
								onClick={() => removeFile(index)}
								className="text-red-600 hover:text-red-800"
							>
								<XCircle className="h-4 w-4" />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Error display */}
			{processing.error && (
				<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-600">{processing.error}</p>
				</div>
			)}
		</div>
	);
}
