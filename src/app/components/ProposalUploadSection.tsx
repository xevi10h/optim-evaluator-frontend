'use client';

import React, { useRef, useState } from 'react';
import {
	FileText,
	CheckCircle,
	XCircle,
	Loader2,
	AlertTriangle,
	Package,
} from 'lucide-react';
import type { ProposalFile, LotInfo } from '@/types';
import { useFileProcessing, useDragAndDrop } from '@/hooks/useFileProcessing';

interface ProposalUploadSectionProps {
	extractedLots: LotInfo[];
	proposalFiles: ProposalFile[];
	setProposalFiles: (files: ProposalFile[]) => void;
}

const normalizeFileName = (fileName: string): string => {
	try {
		let normalized = fileName;

		const charReplacements: { [key: string]: string } = {
			'Ã¨': 'è',
			'Ã©': 'é',
			'Ã¡': 'á',
			'Ã­': 'í',
			'Ã³': 'ó',
			Ãº: 'ú',
			'Ã¼': 'ü',
			'Ã±': 'ñ',
			'Ã§': 'ç',
			'Ã ': 'à',
			'Ã²': 'ò',
			TeÌcnic: 'Tècnic',
			teÌcnic: 'tècnic',
			TeÌ: 'Tè',
			teÌ: 'tè',
			'Tè€cnic': 'Tècnic',
			'tè€cnic': 'tècnic',
			'è€': 'è',
			'é€': 'é',
			'à€': 'à',
			'ò€': 'ò',
			'ú€': 'ú',
			'í€': 'í',
			'ó€': 'ó',
			'ñ€': 'ñ',
			'ç€': 'ç',
			'ü€': 'ü',
		};

		for (const [bad, good] of Object.entries(charReplacements)) {
			normalized = normalized.replace(new RegExp(bad, 'g'), good);
		}

		try {
			normalized = decodeURIComponent(escape(normalized));
		} catch (e) {
			console.warn('Failed to decode URI component, using replacement method');
		}

		normalized = normalized.normalize('NFC');

		return normalized;
	} catch (error) {
		console.warn('Error normalizing filename:', error);
		return fileName;
	}
};

export default function ProposalUploadSection({
	extractedLots,
	proposalFiles,
	setProposalFiles,
}: ProposalUploadSectionProps) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [selectedLot, setSelectedLot] = useState<number>(1);
	const processing = useFileProcessing();
	const dragDrop = useDragAndDrop();

	const handleFiles = async (selectedFiles: File[]) => {
		try {
			const processedFiles = await processing.processFiles(
				selectedFiles,
				'proposal',
			);
			const proposalFilesWithLot: ProposalFile[] = processedFiles.map(
				(file) => ({
					...file,
					name: normalizeFileName(file.name),
					lotNumber: selectedLot,
				}),
			);
			setProposalFiles([...proposalFiles, ...proposalFilesWithLot]);
		} catch (err) {
			console.error('Error processing files:', err);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		const droppedFiles = Array.from(e.dataTransfer.files);
		dragDrop.dragHandlers.onDrop(e, () => handleFiles(droppedFiles));
	};

	const removeFile = (index: number) => {
		setProposalFiles(proposalFiles.filter((_, i) => i !== index));
	};

	const getFileStatus = (file: ProposalFile) => {
		if (file.content.length < 100) {
			return {
				status: 'warning' as const,
				icon: (
					<AlertTriangle className="h-5 w-5" style={{ color: '#f59e0b' }} />
				),
				color: '#f59e0b',
				bgColor: '#fffbeb',
				message: 'Contingut mínim extret',
			};
		} else {
			return {
				status: 'success' as const,
				icon: <CheckCircle className="h-5 w-5" style={{ color: '#199875' }} />,
				color: '#199875',
				bgColor: '#dfe7e6',
				message: 'Processat correctament',
			};
		}
	};

	const getFilesByLot = (lotNumber: number) => {
		return proposalFiles.filter((file) => file.lotNumber === lotNumber);
	};

	const showLotSelection = extractedLots.length > 1;

	return (
		<div>
			<div className="flex items-start justify-between mb-4 gap-4">
				<h4 className="text-md font-medium flex-1" style={{ color: '#1c1c1c' }}>
					Proposta a Avaluar *
				</h4>

				{showLotSelection && (
					<div className="flex items-center space-x-2 flex-shrink-0 min-w-0">
						<label
							className="text-sm font-medium whitespace-nowrap hidden sm:block"
							style={{ color: '#1c1c1c' }}
						>
							Lot:
						</label>
						<select
							value={selectedLot}
							onChange={(e) => setSelectedLot(Number(e.target.value))}
							className="px-2 py-1 border rounded focus:ring-2 focus:ring-opacity-50 focus:border-transparent text-sm w-48 cursor-pointer"
							style={{ borderColor: '#dfe7e6', color: '#1c1c1c' }}
							title={`Lot ${selectedLot}: ${
								extractedLots.find((l) => l.lotNumber === selectedLot)?.title ||
								''
							}`}
						>
							{extractedLots.map((lot) => (
								<option key={lot.lotNumber} value={lot.lotNumber}>
									Lot {lot.lotNumber}:{' '}
									{lot.title.length > 25
										? lot.title.substring(0, 25) + '...'
										: lot.title}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			<div
				className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer hover:border-opacity-80 ${
					dragDrop.isDragging
						? 'border-blue-500 bg-blue-50'
						: 'hover:bg-gray-50'
				}`}
				style={{
					borderColor: dragDrop.isDragging ? '#3b82f6' : '#949494',
				}}
				{...dragDrop.dragHandlers}
				onDrop={handleDrop}
				onClick={() => fileRef.current?.click()}
			>
				<FileText
					className="mx-auto h-12 w-12 mb-4"
					style={{ color: '#949494' }}
				/>
				<p className="mb-2" style={{ color: '#6f6f6f' }}>
					Arrossega arxius aquí o fes clic per seleccionar
				</p>
				<p className="text-sm" style={{ color: '#949494' }}>
					PDF, DOC, DOCX - Màxim 10MB
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

			{processing.isProcessing && (
				<div
					className="mt-4 p-4 rounded-lg border"
					style={{ backgroundColor: '#f3f4f6', borderColor: '#199875' }}
				>
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center space-x-2">
							<Loader2
								className="h-4 w-4 animate-spin"
								style={{ color: '#199875' }}
							/>
							<span
								className="text-sm font-medium"
								style={{ color: '#1c1c1c' }}
							>
								{processing.currentFile
									? normalizeFileName(processing.currentFile)
									: 'Processant arxius...'}
							</span>
						</div>
						<span className="text-sm" style={{ color: '#6f6f6f' }}>
							{Math.round(processing.progress)}%
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="h-2 rounded-full transition-all duration-500"
							style={{
								backgroundColor: '#199875',
								width: `${processing.progress}%`,
							}}
						></div>
					</div>
				</div>
			)}

			{extractedLots.length > 0 && (
				<div className="mt-4 space-y-3">
					<div className="flex items-center justify-between">
						<h5 className="text-sm font-medium" style={{ color: '#1c1c1c' }}>
							Propostes per Lot
						</h5>
					</div>

					{extractedLots.map((lot) => {
						const lotFiles = getFilesByLot(lot.lotNumber);
						return (
							<div
								key={lot.lotNumber}
								className="mb-4 border rounded-lg p-4"
								style={{ borderColor: '#dfe7e6', backgroundColor: '#f8f9fa' }}
							>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center space-x-2">
										<Package
											className="h-6 w-6 flex-shrink-0 mr-4"
											style={{ color: '#199875' }}
										/>
										<span className="font-medium" style={{ color: '#1c1c1c' }}>
											<span className="font-semibold">
												Lot {lot.lotNumber}:{' '}
											</span>
											{lot.title}
										</span>
									</div>
								</div>

								{lotFiles.length === 0 ? (
									<div className="text-center py-4">
										<AlertTriangle
											className="h-8 w-8 mx-auto mb-2"
											style={{ color: '#f59e0b' }}
										/>
										<p className="text-sm" style={{ color: '#f59e0b' }}>
											No s'ha presentat proposta per aquest lot
										</p>
									</div>
								) : (
									<div className="space-y-2">
										{lotFiles.map((file, index) => {
											const fileStatus = getFileStatus(file);
											const globalIndex = proposalFiles.indexOf(file);
											const displayName = normalizeFileName(file.name);

											return (
												<div
													key={index}
													className="border rounded p-3 transition-all duration-200 hover:shadow-sm"
													style={{
														backgroundColor: fileStatus.bgColor,
														borderColor: fileStatus.color + '40',
													}}
												>
													<div className="flex items-center justify-between">
														<div className="flex items-center space-x-3">
															{fileStatus.icon}
															<div>
																<span
																	className="text-sm font-medium"
																	style={{ color: '#1c1c1c' }}
																>
																	{displayName}
																</span>
																<div className="flex items-center space-x-3 mt-1">
																	<p
																		className="text-xs"
																		style={{ color: fileStatus.color }}
																	>
																		{fileStatus.message}
																	</p>
																	<span
																		className="text-xs"
																		style={{ color: '#6f6f6f' }}
																	>
																		{file.content.length.toLocaleString()}{' '}
																		caràcters
																	</span>
																</div>
															</div>
														</div>
														<button
															onClick={() => removeFile(globalIndex)}
															className="text-red-600 hover:text-red-800 p-1 rounded transition-colors cursor-pointer"
															title="Eliminar arxiu"
														>
															<XCircle className="h-4 w-4" />
														</button>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{processing.error && (
				<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<div className="flex items-start space-x-2">
						<AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
						<div>
							<p className="text-sm font-medium text-red-800">
								Error processant arxius
							</p>
							<div className="text-sm text-red-600 mt-1 max-h-32 overflow-y-auto">
								<pre className="whitespace-pre-wrap">{processing.error}</pre>
							</div>
							<button
								onClick={processing.clearError}
								className="text-xs text-red-700 hover:text-red-900 underline mt-2 cursor-pointer"
							>
								Tancar missatge
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
