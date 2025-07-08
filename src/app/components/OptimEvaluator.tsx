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
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jsPDF from 'jspdf';
import mammoth from 'mammoth';

// TypeScript interfaces
interface FileWithContent {
	file: File;
	content: string;
	name: string;
}

interface EvaluationCriteria {
	criterion: string;
	score: 'INSUFICIENT' | 'REGULAR' | 'COMPLEIX_EXITOSAMENT';
	justification: string;
	strengths: string[];
	improvements: string[];
	references: string[];
}

interface EvaluationResult {
	summary: string;
	criteria: EvaluationCriteria[];
	recommendation: string;
	confidence: number;
}

export default function OptimEvaluator() {
	const [basicInfo, setBasicInfo] = useState({
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

	const specFileRef = useRef<HTMLInputElement>(null);
	const proposalFileRef = useRef<HTMLInputElement>(null);

	// Function to process files
	const processFile = async (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = async (e) => {
				const arrayBuffer = e.target?.result as ArrayBuffer;

				if (file.type === 'application/pdf') {
					// For PDF, we would need a library like pdf-parse
					// For now, return a placeholder
					resolve(`[Contingut PDF de ${file.name}]`);
				} else if (file.type.includes('word') || file.name.endsWith('.docx')) {
					try {
						const result = await mammoth.extractRawText({ arrayBuffer });
						resolve(result.value);
					} catch (err) {
						reject(err);
					}
				} else if (file.type === 'text/plain') {
					resolve(new TextDecoder().decode(arrayBuffer));
				} else {
					reject(new Error("Tipus d'arxiu no suportat"));
				}
			};

			reader.onerror = () => reject(new Error("Error en llegir l'arxiu"));
			reader.readAsArrayBuffer(file);
		});
	};

	// Drag and drop handlers
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		async (e: React.DragEvent, type: 'spec' | 'proposal') => {
			e.preventDefault();
			e.stopPropagation();

			const files = Array.from(e.dataTransfer.files);
			await handleFiles(files, type);
		},
		[],
	);

	const handleFiles = async (files: File[], type: 'spec' | 'proposal') => {
		const processedFiles: FileWithContent[] = [];

		for (const file of files) {
			if (file.size > 10 * 1024 * 1024) {
				// 10MB limit
				setError(`L'arxiu ${file.name} supera el límit de 10MB`);
				continue;
			}

			try {
				const content = await processFile(file);
				processedFiles.push({
					file,
					content,
					name: file.name,
				});
			} catch (err) {
				setError(`Error processant ${file.name}: ${err}`);
			}
		}

		if (type === 'spec') {
			setSpecificationFiles((prev) => [...prev, ...processedFiles]);
		} else {
			setProposalFiles((prev) => [...prev, ...processedFiles]);
		}
	};

	// Function to evaluate with AI (simulated)
	const evaluateWithAI = async (): Promise<EvaluationResult> => {
		// Simulate call to Google Gemini
		await new Promise((resolve) => setTimeout(resolve, 3000));

		return {
			summary:
				"La proposta presentada compleix amb els requisits tècnics bàsics establerts al plec de condicions. S'observa una sòlida experiència de l'equip tècnic i una metodologia ben estructurada. Tanmateix, s'identifiquen àrees de millora en el cronograma i en la proposta econòmica.",
			criteria: [
				{
					criterion: "Capacitat tècnica de l'equip",
					score: 'COMPLEIX_EXITOSAMENT',
					justification:
						"L'equip proposat compta amb àmplia experiència en projectes similars. Es presenta un CV detallat de cada membre amb certificacions rellevants i projectes previs exitosos. L'estructura organitzativa és clara i ben definida.",
					strengths: [
						'Experiència comprovada',
						'Certificacions actualitzades',
						'Estructura organitzativa clara',
					],
					improvements: [
						'Podria incloure més detalls sobre disponibilitat',
						'Falta pla de contingència per a recursos',
					],
					references: ['Apartat 3.2 del plec', 'Annex II - Requisits tècnics'],
				},
				{
					criterion: 'Metodologia proposada',
					score: 'REGULAR',
					justification:
						"La metodologia presentada és adequada però genèrica. Es basa en frameworks estàndard de la indústria però manca d'adaptació específica als requisits particulars del projecte. Les fases estan ben definides però els lliurables podrien ser més específics.",
					strengths: [
						'Framework reconegut',
						'Fases ben definides',
						'Controls de qualitat inclosos',
					],
					improvements: [
						'Adaptació específica al projecte',
						'Lliurables més detallats',
						'Mètriques de seguiment',
					],
					references: ['Apartat 4.1 del plec', 'Especificacions tècniques'],
				},
				{
					criterion: "Cronograma d'execució",
					score: 'INSUFICIENT',
					justification:
						'El cronograma presentat no és realista per a la complexitat del projecte. Els terminis proposats són massa optimistes i no consideren adequadament les dependències entre tasques. Falta anàlisi de riscos temporals.',
					strengths: ['Fites principals identificades', "Ús d'eines de gestió"],
					improvements: [
						'Terminis més realistes',
						'Anàlisi de dependències',
						'Pla de contingència temporal',
					],
					references: ['Apartat 5.3 del plec', 'Cronograma mínim requerit'],
				},
			],
			recommendation:
				"Es recomana sol·licitar aclariments sobre el cronograma i la metodologia abans de l'adjudicació. La proposta té potencial però requereix ajustos importants.",
			confidence: 0.85,
		};
	};

	// Function to generate PDF
	const generatePDF = () => {
		if (!evaluationResult) return;

		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();

		// Configure fonts and colors
		doc.setFontSize(20);
		doc.setTextColor(25, 152, 117); // Primary color
		doc.text("INFORME D'AVALUACIÓ DE PROPOSTA", pageWidth / 2, 30, {
			align: 'center',
		});

		// Basic information
		doc.setFontSize(12);
		doc.setTextColor(28, 28, 28); // Dark text
		doc.text(`Títol: ${basicInfo.title}`, 20, 50);
		doc.text(`Expedient: ${basicInfo.expedient}`, 20, 60);
		doc.text(`Entitat: ${basicInfo.entity}`, 20, 70);
		doc.text(`Data: ${new Date().toLocaleDateString('ca-ES')}`, 20, 80);

		// Executive summary
		doc.setFontSize(14);
		doc.setTextColor(25, 152, 117);
		doc.text('RESUM EXECUTIU', 20, 100);

		doc.setFontSize(10);
		doc.setTextColor(28, 28, 28);
		const splitSummary = doc.splitTextToSize(
			evaluationResult.summary,
			pageWidth - 40,
		);
		doc.text(splitSummary, 20, 110);

		let yPosition = 110 + splitSummary.length * 5 + 20;

		// Evaluation by criteria
		doc.setFontSize(14);
		doc.setTextColor(25, 152, 117);
		doc.text('AVALUACIÓ DETALLADA', 20, yPosition);
		yPosition += 15;

		evaluationResult.criteria.forEach((criterion, index) => {
			if (yPosition > pageHeight - 40) {
				doc.addPage();
				yPosition = 20;
			}

			doc.setFontSize(12);
			doc.setTextColor(28, 28, 28);
			doc.text(`${index + 1}. ${criterion.criterion}`, 20, yPosition);
			yPosition += 10;

			// Score with color
			const scoreColor =
				criterion.score === 'COMPLEIX_EXITOSAMENT'
					? [25, 152, 117]
					: criterion.score === 'REGULAR'
					? [245, 158, 11]
					: [220, 38, 38];
			doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
			doc.text(`Qualificació: ${criterion.score}`, 25, yPosition);
			yPosition += 10;

			doc.setTextColor(28, 28, 28);
			const splitJustification = doc.splitTextToSize(
				criterion.justification,
				pageWidth - 50,
			);
			doc.text(splitJustification, 25, yPosition);
			yPosition += splitJustification.length * 5 + 10;
		});

		// Final recommendation
		if (yPosition > pageHeight - 60) {
			doc.addPage();
			yPosition = 20;
		}

		doc.setFontSize(14);
		doc.setTextColor(25, 152, 117);
		doc.text('RECOMANACIÓ FINAL', 20, yPosition);
		yPosition += 15;

		doc.setFontSize(10);
		doc.setTextColor(28, 28, 28);
		const splitRecommendation = doc.splitTextToSize(
			evaluationResult.recommendation,
			pageWidth - 40,
		);
		doc.text(splitRecommendation, 20, yPosition);

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

		try {
			const result = await evaluateWithAI();
			setEvaluationResult(result);
		} catch (err) {
			setError("Error durant l'avaluació. Torna-ho a intentar.");
		} finally {
			setIsEvaluating(false);
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
									Sistema d'Avaluació de Licitacions
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
									className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
									style={{ borderColor: '#dfe7e6', color: '#1c1c1c' }}
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
									className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
									style={{ borderColor: '#dfe7e6', color: '#1c1c1c' }}
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
									className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
									style={{ borderColor: '#dfe7e6', color: '#1c1c1c' }}
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
									className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
									style={{ borderColor: '#dfe7e6', color: '#1c1c1c' }}
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
										className="border-2 border-dashed rounded-lg p-8 text-center hover:border-opacity-80 transition-colors cursor-pointer"
										style={{ borderColor: '#949494' }}
										onDragOver={handleDragOver}
										onDrop={(e) => handleDrop(e, 'spec')}
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
														onClick={() =>
															setSpecificationFiles((files) =>
																files.filter((_, i) => i !== index),
															)
														}
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
										className="border-2 border-dashed rounded-lg p-8 text-center hover:border-opacity-80 transition-colors cursor-pointer"
										style={{ borderColor: '#949494' }}
										onDragOver={handleDragOver}
										onDrop={(e) => handleDrop(e, 'proposal')}
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
														onClick={() =>
															setProposalFiles((files) =>
																files.filter((_, i) => i !== index),
															)
														}
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

					{/* Evaluation button */}
					<div
						className="border-t px-6 py-4"
						style={{ borderColor: '#dfe7e6', backgroundColor: '#dfe7e6' }}
					>
						<div className="flex justify-between items-center">
							<div className="flex items-center space-x-4">
								{error && (
									<div className="flex items-center text-red-600">
										<AlertCircle className="h-5 w-5 mr-2" />
										<span className="text-sm">{error}</span>
									</div>
								)}
							</div>

							<button
								onClick={handleEvaluate}
								disabled={isEvaluating}
								className="px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors text-white disabled:opacity-50"
								style={{
									backgroundColor: isEvaluating ? '#949494' : '#199875',
								}}
								onMouseEnter={(e) => {
									if (!isEvaluating) {
										e.currentTarget.style.backgroundColor = '#188869';
									}
								}}
								onMouseLeave={(e) => {
									if (!isEvaluating) {
										e.currentTarget.style.backgroundColor = '#199875';
									}
								}}
							>
								{isEvaluating ? (
									<>
										<Loader2 className="h-5 w-5 animate-spin" />
										<span>Avaluant...</span>
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
							</div>

							<div className="p-6">
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
															criterion.score === 'COMPLEIX_EXITOSAMENT'
																? '#199875'
																: criterion.score === 'REGULAR'
																? '#f59e0b'
																: '#dc2626',
														color: 'white',
													}}
												>
													{criterion.score === 'COMPLEIX_EXITOSAMENT'
														? '🟢 COMPLEIX EXITOSAMENT'
														: criterion.score === 'REGULAR'
														? '🟡 REGULAR'
														: '🔴 INSUFICIENT'}
												</span>
											</div>

											<p className="mb-4" style={{ color: '#6f6f6f' }}>
												{criterion.justification}
											</p>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
											</div>
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
