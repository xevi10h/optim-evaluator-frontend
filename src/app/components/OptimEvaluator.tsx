'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
	Upload,
	FileText,
	Download,
	CheckCircle,
	XCircle,
	AlertCircle,
	Loader2,
	FileCheck,
	Shield,
	Sparkles,
	Building,
	Brain,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useFileProcessing, useDragAndDrop } from '@/hooks/useFileProcessing';
import type {
	FileWithContent,
	EvaluationResult,
	BasicInfo,
	FileContent,
} from '@/types';

// TypeScript interfaces
// Las interfaces ahora están en @/types

export default function OptimEvaluator() {
	const [basicInfo, setBasicInfo] = useState<BasicInfo>({
		title: '',
		expedient: '',
		entity: '',
		context: '',
	});

	const [specificationFiles, setSpecificationFiles] = useState<
		FileWithContent[]
	>([]);
	const [proposalFiles, setProposalFiles] = useState<FileWithContent[]>([]);
	const [isEvaluating, setIsEvaluating] = useState(false);
	const [evaluationResult, setEvaluationResult] =
		useState<EvaluationResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [evaluationStatus, setEvaluationStatus] = useState<string>('');

	const specFileRef = useRef<HTMLInputElement>(null);
	const proposalFileRef = useRef<HTMLInputElement>(null);

	// Hooks para procesamiento de archivos
	const specProcessing = useFileProcessing();
	const proposalProcessing = useFileProcessing();
	const specDragDrop = useDragAndDrop();
	const proposalDragDrop = useDragAndDrop();

	// Manejar archivos usando el hook
	const handleFiles = async (files: File[], type: 'spec' | 'proposal') => {
		setError(null);

		try {
			const processing = type === 'spec' ? specProcessing : proposalProcessing;
			const processedFiles = await processing.processFiles(files);

			if (type === 'spec') {
				setSpecificationFiles((prev) => [...prev, ...processedFiles]);
			} else {
				setProposalFiles((prev) => [...prev, ...processedFiles]);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error processant arxius');
		}
	};

	// Drag and drop handlers
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleSpecDrop = useCallback((e: React.DragEvent) => {
		const files = Array.from(e.dataTransfer.files);
		specDragDrop.dragHandlers.onDrop(e, () => handleFiles(files, 'spec'));
	}, []);

	const handleProposalDrop = useCallback((e: React.DragEvent) => {
		const files = Array.from(e.dataTransfer.files);
		proposalDragDrop.dragHandlers.onDrop(e, () =>
			handleFiles(files, 'proposal'),
		);
	}, []);

	// Función para evaluar con la API
	const evaluateWithAPI = async (): Promise<EvaluationResult> => {
		const specifications: FileContent[] = specificationFiles.map((file) => ({
			name: file.name,
			content: file.content,
			type: 'specification' as const,
		}));

		const proposals: FileContent[] = proposalFiles.map((file) => ({
			name: file.name,
			content: file.content,
			type: 'proposal' as const,
		}));

		setEvaluationStatus('Connectant amb la intel·ligència artificial...');

		const response = await fetch('/api/evaluate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				specifications,
				proposals,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Error en la evaluación');
		}

		const result = await response.json();
		return result;
	};

	// Función para generar PDF mejorado
	const generatePDF = () => {
		if (!evaluationResult) return;

		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 20;

		// Configurar fuentes
		doc.setFont('helvetica');

		// Portada
		doc.setFontSize(24);
		doc.setTextColor(25, 152, 117);
		doc.text("INFORME D'AVALUACIÓ", pageWidth / 2, 40, { align: 'center' });
		doc.text('DE PROPOSTA DE LICITACIÓ', pageWidth / 2, 55, {
			align: 'center',
		});

		// Información básica
		doc.setFontSize(12);
		doc.setTextColor(60, 60, 60);
		doc.text(`Títol: ${basicInfo.title}`, margin, 80);
		doc.text(`Expedient: ${basicInfo.expedient}`, margin, 95);
		doc.text(`Entitat: ${basicInfo.entity}`, margin, 110);
		doc.text(`Data: ${new Date().toLocaleDateString('ca-ES')}`, margin, 125);
		doc.text(
			`Confiança de l'avaluació: ${Math.round(
				evaluationResult.confidence * 100,
			)}%`,
			margin,
			140,
		);

		// Criterios extraídos
		doc.setFontSize(10);
		doc.setTextColor(100, 100, 100);
		doc.text('Criteris avaluats:', margin, 155);
		evaluationResult.extractedCriteria.forEach((criterion, index) => {
			if (index < 5) {
				// Limitar a 5 criterios en portada
				doc.text(`• ${criterion}`, margin + 5, 165 + index * 5);
			}
		});

		// Nueva página para contenido
		doc.addPage();
		let yPosition = 30;

		// Resumen ejecutivo
		doc.setFontSize(16);
		doc.setTextColor(25, 152, 117);
		doc.text('RESUM EXECUTIU', margin, yPosition);
		yPosition += 15;

		doc.setFontSize(10);
		doc.setTextColor(60, 60, 60);
		const splitSummary = doc.splitTextToSize(
			evaluationResult.summary,
			pageWidth - 2 * margin,
		);
		doc.text(splitSummary, margin, yPosition);
		yPosition += splitSummary.length * 5 + 20;

		// Evaluación detallada
		doc.setFontSize(16);
		doc.setTextColor(25, 152, 117);
		doc.text('AVALUACIÓ DETALLADA', margin, yPosition);
		yPosition += 15;

		evaluationResult.criteria.forEach((criterion, index) => {
			// Verificar si necesitamos nueva página
			if (yPosition > pageHeight - 80) {
				doc.addPage();
				yPosition = 30;
			}

			// Título del criterio
			doc.setFontSize(12);
			doc.setTextColor(60, 60, 60);
			doc.text(`${index + 1}. ${criterion.criterion}`, margin, yPosition);
			yPosition += 10;

			// Puntuación con emoji
			const scoreText =
				criterion.score === 'CUMPLE_EXITOSAMENTE'
					? '🟢 CUMPLE EXITOSAMENTE'
					: criterion.score === 'REGULAR'
					? '🟡 REGULAR'
					: '🔴 INSUFICIENTE';

			doc.setFontSize(10);
			doc.setTextColor(
				criterion.score === 'CUMPLE_EXITOSAMENTE'
					? 25
					: criterion.score === 'REGULAR'
					? 245
					: 220,
				criterion.score === 'CUMPLE_EXITOSAMENTE'
					? 152
					: criterion.score === 'REGULAR'
					? 158
					: 38,
				criterion.score === 'CUMPLE_EXITOSAMENTE'
					? 117
					: criterion.score === 'REGULAR'
					? 11
					: 38,
			);
			doc.text(scoreText, margin + 10, yPosition);
			yPosition += 10;

			// Justificación
			doc.setTextColor(60, 60, 60);
			const splitJustification = doc.splitTextToSize(
				criterion.justification,
				pageWidth - 2 * margin - 20,
			);
			doc.text(splitJustification, margin + 10, yPosition);
			yPosition += splitJustification.length * 4 + 8;

			// Puntos fuertes
			if (criterion.strengths.length > 0) {
				doc.setTextColor(25, 152, 117);
				doc.text('Punts forts:', margin + 10, yPosition);
				yPosition += 5;
				doc.setTextColor(60, 60, 60);
				criterion.strengths.forEach((strength) => {
					doc.text(`• ${strength}`, margin + 15, yPosition);
					yPosition += 4;
				});
				yPosition += 3;
			}

			// Áreas de mejora
			if (criterion.improvements.length > 0) {
				doc.setTextColor(220, 38, 38);
				doc.text('Àrees de millora:', margin + 10, yPosition);
				yPosition += 5;
				doc.setTextColor(60, 60, 60);
				criterion.improvements.forEach((improvement) => {
					doc.text(`• ${improvement}`, margin + 15, yPosition);
					yPosition += 4;
				});
				yPosition += 8;
			}
		});

		// Recomendación final
		if (yPosition > pageHeight - 60) {
			doc.addPage();
			yPosition = 30;
		}

		doc.setFontSize(16);
		doc.setTextColor(25, 152, 117);
		doc.text('RECOMANACIÓ FINAL', margin, yPosition);
		yPosition += 15;

		doc.setFontSize(10);
		doc.setTextColor(60, 60, 60);
		const splitRecommendation = doc.splitTextToSize(
			evaluationResult.recommendation,
			pageWidth - 2 * margin,
		);
		doc.text(splitRecommendation, margin, yPosition);

		// Metadatos finales
		yPosition += splitRecommendation.length * 4 + 20;
		doc.setFontSize(8);
		doc.setTextColor(120, 120, 120);
		doc.text(
			"Generat per OptimEvaluator - Sistema d'Intel·ligència Artificial",
			margin,
			yPosition,
		);
		doc.text(
			`Data de generació: ${new Date().toLocaleString('ca-ES')}`,
			margin,
			yPosition + 10,
		);
		doc.text(`Versió del sistema: v1.0`, margin, yPosition + 20);

		// Descargar PDF
		doc.save(
			`avaluacio_${basicInfo.expedient}_${
				new Date().toISOString().split('T')[0]
			}.pdf`,
		);
	};

	const handleEvaluate = async () => {
		if (
			!basicInfo.title ||
			!basicInfo.expedient ||
			specificationFiles.length === 0 ||
			proposalFiles.length === 0
		) {
			setError('Si us plau, completa tots els camps obligatoris');
			return;
		}

		setIsEvaluating(true);
		setError(null);
		setEvaluationResult(null);

		try {
			setEvaluationStatus("Extraient criteris d'avaluació...");
			const result = await evaluateWithAPI();
			setEvaluationResult(result);
			setEvaluationStatus('');
		} catch (err) {
			setError(
				`Error durant l'avaluació: ${
					err instanceof Error ? err.message : 'Error desconegut'
				}`,
			);
			setEvaluationStatus('');
		} finally {
			setIsEvaluating(false);
		}
	};

	const removeFile = (index: number, type: 'spec' | 'proposal') => {
		if (type === 'spec') {
			setSpecificationFiles((files) => files.filter((_, i) => i !== index));
		} else {
			setProposalFiles((files) => files.filter((_, i) => i !== index));
		}
	};

	return (
		<div
			className="min-h-screen"
			style={{
				background: 'linear-gradient(135deg, #dfe7e6 0%, #ffffff 100%)',
			}}
		>
			{/* Header */}
			<header
				className="bg-white shadow-sm border-b"
				style={{ borderColor: '#dfe7e6' }}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-6">
						<div className="flex items-center space-x-3">
							<div
								className="p-2 rounded-lg"
								style={{ backgroundColor: '#199875' }}
							>
								<Shield className="h-8 w-8 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold" style={{ color: '#1c1c1c' }}>
									OptimEvaluator
								</h1>
								<p className="text-sm" style={{ color: '#6f6f6f' }}>
									Sistema d'Avaluació de Licitacions amb IA
								</p>
							</div>
						</div>
						<div
							className="flex items-center space-x-2 text-sm"
							style={{ color: '#6f6f6f' }}
						>
							<Building className="h-4 w-4" />
							<span>Optim People</span>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-white rounded-xl shadow-lg overflow-hidden">
					{/* Basic information */}
					<div
						className="px-6 py-4"
						style={{
							background: 'linear-gradient(135deg, #199875 0%, #188869 100%)',
						}}
					>
						<h2 className="text-xl font-semibold text-white flex items-center">
							<FileText className="mr-2 h-5 w-5" />
							Informació de la Licitació
						</h2>
					</div>

					<div className="p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label
									className="block text-sm font-medium mb-2"
									style={{ color: '#1c1c1c' }}
								>
									Títol de la Licitació *
								</label>
								<input
									type="text"
									value={basicInfo.title}
									onChange={(e) =>
										setBasicInfo({ ...basicInfo, title: e.target.value })
									}
									className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
									style={{
										borderColor: '#dfe7e6',
										color: '#1c1c1c',
									}}
									placeholder="Ex: Servei de consultoria tecnològica"
								/>
							</div>

							<div>
								<label
									className="block text-sm font-medium mb-2"
									style={{ color: '#1c1c1c' }}
								>
									Número d'Expedient *
								</label>
								<input
									type="text"
									value={basicInfo.expedient}
									onChange={(e) =>
										setBasicInfo({ ...basicInfo, expedient: e.target.value })
									}
									className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
									style={{
										borderColor: '#dfe7e6',
										color: '#1c1c1c',
									}}
									placeholder="Ex: EXP-2024-001"
								/>
							</div>

							<div>
								<label
									className="block text-sm font-medium mb-2"
									style={{ color: '#1c1c1c' }}
								>
									Entitat Contractant
								</label>
								<input
									type="text"
									value={basicInfo.entity}
									onChange={(e) =>
										setBasicInfo({ ...basicInfo, entity: e.target.value })
									}
									className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
									style={{
										borderColor: '#dfe7e6',
										color: '#1c1c1c',
									}}
									placeholder="Ex: Generalitat de Catalunya"
								/>
							</div>

							<div>
								<label
									className="block text-sm font-medium mb-2"
									style={{ color: '#1c1c1c' }}
								>
									Context Adicional
								</label>
								<textarea
									value={basicInfo.context}
									onChange={(e) =>
										setBasicInfo({ ...basicInfo, context: e.target.value })
									}
									rows={3}
									className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
									style={{
										borderColor: '#dfe7e6',
										color: '#1c1c1c',
									}}
									placeholder="Informació addicional rellevant per a l'avaluació..."
								/>
							</div>
						</div>
					</div>

					{/* Files section */}
					<div className="border-t" style={{ borderColor: '#dfe7e6' }}>
						<div className="px-6 py-4" style={{ backgroundColor: '#dfe7e6' }}>
							<h3
								className="text-lg font-semibold flex items-center"
								style={{ color: '#1c1c1c' }}
							>
								<Upload className="mr-2 h-5 w-5" />
								Documents de la Licitació
							</h3>
						</div>

						<div className="p-6">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								{/* Specifications */}
								<div>
									<h4
										className="text-md font-medium mb-4"
										style={{ color: '#1c1c1c' }}
									>
										Plec de Condicions *
									</h4>
									<div
										className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-opacity-80 transition-colors cursor-pointer ${
											specDragDrop.isDragging
												? 'border-blue-500 bg-blue-50'
												: ''
										}`}
										style={{
											borderColor: specDragDrop.isDragging
												? '#3b82f6'
												: '#949494',
										}}
										{...specDragDrop.dragHandlers}
										onDrop={handleSpecDrop}
										onClick={() => specFileRef.current?.click()}
									>
										<FileCheck
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
										ref={specFileRef}
										type="file"
										multiple
										accept=".pdf,.doc,.docx,.txt"
										onChange={(e) =>
											e.target.files &&
											handleFiles(Array.from(e.target.files), 'spec')
										}
										className="hidden"
									/>

									{/* Indicador de progreso para especificaciones */}
									{specProcessing.isProcessing && (
										<div
											className="mt-4 p-4 rounded-lg"
											style={{ backgroundColor: '#f3f4f6' }}
										>
											<div className="flex items-center justify-between mb-2">
												<span
													className="text-sm font-medium"
													style={{ color: '#1c1c1c' }}
												>
													Processant: {specProcessing.currentFile}
												</span>
												<span className="text-sm" style={{ color: '#6f6f6f' }}>
													{Math.round(specProcessing.progress)}%
												</span>
											</div>
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className="h-2 rounded-full transition-all duration-300"
													style={{
														backgroundColor: '#199875',
														width: `${specProcessing.progress}%`,
													}}
												></div>
											</div>
										</div>
									)}

									{specificationFiles.length > 0 && (
										<div className="mt-4 space-y-2">
											{specificationFiles.map((file, index) => (
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
														onClick={() => removeFile(index, 'spec')}
														className="text-red-600 hover:text-red-800"
													>
														<XCircle className="h-4 w-4" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Proposal to evaluate */}
								<div>
									<h4
										className="text-md font-medium mb-4"
										style={{ color: '#1c1c1c' }}
									>
										Proposta a Avaluar *
									</h4>
									<div
										className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-opacity-80 transition-colors cursor-pointer ${
											proposalDragDrop.isDragging
												? 'border-blue-500 bg-blue-50'
												: ''
										}`}
										style={{
											borderColor: proposalDragDrop.isDragging
												? '#3b82f6'
												: '#949494',
										}}
										{...proposalDragDrop.dragHandlers}
										onDrop={handleProposalDrop}
										onClick={() => proposalFileRef.current?.click()}
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
										ref={proposalFileRef}
										type="file"
										multiple
										accept=".pdf,.doc,.docx,.txt"
										onChange={(e) =>
											e.target.files &&
											handleFiles(Array.from(e.target.files), 'proposal')
										}
										className="hidden"
									/>

									{/* Indicador de progreso para propuestas */}
									{proposalProcessing.isProcessing && (
										<div
											className="mt-4 p-4 rounded-lg"
											style={{ backgroundColor: '#f3f4f6' }}
										>
											<div className="flex items-center justify-between mb-2">
												<span
													className="text-sm font-medium"
													style={{ color: '#1c1c1c' }}
												>
													Processant: {proposalProcessing.currentFile}
												</span>
												<span className="text-sm" style={{ color: '#6f6f6f' }}>
													{Math.round(proposalProcessing.progress)}%
												</span>
											</div>
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className="h-2 rounded-full transition-all duration-300"
													style={{
														backgroundColor: '#199875',
														width: `${proposalProcessing.progress}%`,
													}}
												></div>
											</div>
										</div>
									)}

									{proposalFiles.length > 0 && (
										<div className="mt-4 space-y-2">
											{proposalFiles.map((file, index) => (
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
														onClick={() => removeFile(index, 'proposal')}
														className="text-red-600 hover:text-red-800"
													>
														<XCircle className="h-4 w-4" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Evaluation section */}
					<div
						className="border-t px-6 py-4"
						style={{ borderColor: '#dfe7e6', backgroundColor: '#dfe7e6' }}
					>
						<div className="flex justify-between items-center">
							<div className="flex items-center space-x-4">
								{(error ||
									specProcessing.error ||
									proposalProcessing.error) && (
									<div className="flex items-center text-red-600">
										<AlertCircle className="h-5 w-5 mr-2" />
										<span className="text-sm">
											{error ||
												specProcessing.error ||
												proposalProcessing.error}
										</span>
									</div>
								)}
								{evaluationStatus && (
									<div
										className="flex items-center"
										style={{ color: '#199875' }}
									>
										<Brain className="h-5 w-5 mr-2" />
										<span className="text-sm">{evaluationStatus}</span>
									</div>
								)}
								{(specProcessing.isProcessing ||
									proposalProcessing.isProcessing) && (
									<div
										className="flex items-center"
										style={{ color: '#199875' }}
									>
										<Loader2 className="h-5 w-5 mr-2 animate-spin" />
										<span className="text-sm">Processant arxius...</span>
									</div>
								)}
							</div>

							<button
								onClick={handleEvaluate}
								disabled={
									isEvaluating ||
									specProcessing.isProcessing ||
									proposalProcessing.isProcessing
								}
								className="px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors text-white disabled:opacity-50"
								style={{
									backgroundColor:
										isEvaluating ||
										specProcessing.isProcessing ||
										proposalProcessing.isProcessing
											? '#949494'
											: '#199875',
								}}
								onMouseEnter={(e) => {
									if (
										!isEvaluating &&
										!specProcessing.isProcessing &&
										!proposalProcessing.isProcessing
									) {
										e.currentTarget.style.backgroundColor = '#188869';
									}
								}}
								onMouseLeave={(e) => {
									if (
										!isEvaluating &&
										!specProcessing.isProcessing &&
										!proposalProcessing.isProcessing
									) {
										e.currentTarget.style.backgroundColor = '#199875';
									}
								}}
							>
								{isEvaluating ? (
									<>
										<Loader2 className="h-5 w-5 animate-spin" />
										<span>Avaluant amb IA...</span>
									</>
								) : specProcessing.isProcessing ||
								  proposalProcessing.isProcessing ? (
									<>
										<Loader2 className="h-5 w-5 animate-spin" />
										<span>Processant arxius...</span>
									</>
								) : (
									<>
										<Sparkles className="h-5 w-5" />
										<span>Avaluar Proposta</span>
									</>
								)}
							</button>
						</div>
					</div>

					{/* Results */}
					{evaluationResult && (
						<div className="border-t" style={{ borderColor: '#dfe7e6' }}>
							<div
								className="px-6 py-4"
								style={{
									background:
										'linear-gradient(135deg, #199875 0%, #188869 100%)',
								}}
							>
								<h3 className="text-xl font-semibold text-white flex items-center">
									<CheckCircle className="mr-2 h-5 w-5" />
									Resultat de l'Avaluació
								</h3>
								<p className="text-sm text-white opacity-90 mt-1">
									Confiança: {Math.round(evaluationResult.confidence * 100)}% |
									Criteris avaluats: {evaluationResult.criteria.length}
								</p>
							</div>

							<div className="p-6">
								{/* Criterios extraídos */}
								<div
									className="rounded-lg p-4 mb-6"
									style={{
										backgroundColor: '#f8f9fa',
										borderLeft: '4px solid #199875',
									}}
								>
									<h4
										className="text-md font-semibold mb-2"
										style={{ color: '#1c1c1c' }}
									>
										Criteris Identificats per la IA
									</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
										{evaluationResult.extractedCriteria.map(
											(criterion, index) => (
												<div
													key={index}
													className="flex items-center text-sm"
													style={{ color: '#6f6f6f' }}
												>
													<CheckCircle
														className="h-4 w-4 mr-2"
														style={{ color: '#199875' }}
													/>
													{criterion}
												</div>
											),
										)}
									</div>
								</div>

								{/* Executive summary */}
								<div
									className="rounded-lg p-6 mb-6"
									style={{ backgroundColor: '#dfe7e6' }}
								>
									<h4
										className="text-lg font-semibold mb-3"
										style={{ color: '#1c1c1c' }}
									>
										Resum Executiu
									</h4>
									<p className="leading-relaxed" style={{ color: '#6f6f6f' }}>
										{evaluationResult.summary}
									</p>
								</div>

								{/* Evaluation criteria */}
								<div className="space-y-6">
									<h4
										className="text-lg font-semibold"
										style={{ color: '#1c1c1c' }}
									>
										Avaluació per Criteris
									</h4>

									{evaluationResult.criteria.map((criterion, index) => (
										<div
											key={index}
											className="border rounded-lg p-6"
											style={{ borderColor: '#dfe7e6' }}
										>
											<div className="flex items-start justify-between mb-4">
												<h5
													className="text-md font-semibold"
													style={{ color: '#1c1c1c' }}
												>
													{criterion.criterion}
												</h5>
												<span
													className="px-3 py-1 rounded-full text-sm font-medium"
													style={{
														backgroundColor:
															criterion.score === 'CUMPLE_EXITOSAMENTE'
																? '#199875'
																: criterion.score === 'REGULAR'
																? '#f59e0b'
																: '#dc2626',
														color: 'white',
													}}
												>
													{criterion.score === 'CUMPLE_EXITOSAMENTE'
														? '🟢 CUMPLE EXITOSAMENTE'
														: criterion.score === 'REGULAR'
														? '🟡 REGULAR'
														: '🔴 INSUFICIENTE'}
												</span>
											</div>

											<p className="mb-4" style={{ color: '#6f6f6f' }}>
												{criterion.justification}
											</p>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{criterion.strengths.length > 0 && (
													<div>
														<h6
															className="font-medium mb-2"
															style={{ color: '#199875' }}
														>
															Punts Forts
														</h6>
														<ul className="space-y-1">
															{criterion.strengths.map((strength, i) => (
																<li
																	key={i}
																	className="text-sm"
																	style={{ color: '#188869' }}
																>
																	• {strength}
																</li>
															))}
														</ul>
													</div>
												)}

												{criterion.improvements.length > 0 && (
													<div>
														<h6 className="font-medium mb-2 text-red-700">
															Àrees de Millora
														</h6>
														<ul className="space-y-1">
															{criterion.improvements.map((improvement, i) => (
																<li key={i} className="text-sm text-red-600">
																	• {improvement}
																</li>
															))}
														</ul>
													</div>
												)}
											</div>

											{criterion.references.length > 0 && (
												<div
													className="mt-4 pt-4 border-t"
													style={{ borderColor: '#dfe7e6' }}
												>
													<h6
														className="font-medium mb-2"
														style={{ color: '#6f6f6f' }}
													>
														Referències
													</h6>
													<div className="flex flex-wrap gap-2">
														{criterion.references.map((ref, i) => (
															<span
																key={i}
																className="px-2 py-1 rounded text-xs"
																style={{
																	backgroundColor: '#f3f4f6',
																	color: '#6f6f6f',
																}}
															>
																{ref}
															</span>
														))}
													</div>
												</div>
											)}
										</div>
									))}
								</div>

								{/* Final recommendation */}
								<div
									className="rounded-lg p-6 mt-6"
									style={{ backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }}
								>
									<h4
										className="text-lg font-semibold mb-3"
										style={{ color: '#856404' }}
									>
										Recomanació Final
									</h4>
									<p className="leading-relaxed" style={{ color: '#856404' }}>
										{evaluationResult.recommendation}
									</p>
								</div>

								{/* Download button */}
								<div className="flex justify-center mt-8">
									<button
										onClick={generatePDF}
										className="px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors text-white"
										style={{ backgroundColor: '#199875' }}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = '#188869';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = '#199875';
										}}
									>
										<Download className="h-5 w-5" />
										<span>Descarregar Informe PDF</span>
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
