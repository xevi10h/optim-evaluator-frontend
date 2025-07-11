import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import FormData from 'form-data';
import axios from 'axios';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/msword',
	'text/plain',
];

const PDFREST_API_KEY = '0d040095-68ab-41e7-a0f8-3c9dca8b2756';

interface ProcessedFile {
	name: string;
	content: string;
	type: 'specification' | 'proposal';
	success: boolean;
	error?: string;
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const files = formData.getAll('files') as File[];
		const type = formData.get('type') as 'specification' | 'proposal';

		if (!files || files.length === 0) {
			return NextResponse.json(
				{ error: "No s'han proporcionat fitxers" },
				{ status: 400 },
			);
		}

		if (!type || !['specification', 'proposal'].includes(type)) {
			return NextResponse.json(
				{ error: 'Tipus de fitxer no vàlid' },
				{ status: 400 },
			);
		}

		const processedFiles: ProcessedFile[] = [];

		for (const file of files) {
			try {
				console.log(`📄 Processant fitxer: ${file.name}`);

				if (file.size > MAX_FILE_SIZE) {
					processedFiles.push({
						name: file.name,
						content: '',
						type,
						success: false,
						error: `Fitxer massa gran: ${file.name} (màxim 10MB)`,
					});
					continue;
				}

				if (!SUPPORTED_TYPES.includes(file.type)) {
					processedFiles.push({
						name: file.name,
						content: '',
						type,
						success: false,
						error: `Tipus de fitxer no suportat: ${file.type}`,
					});
					continue;
				}

				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				let content = '';

				if (file.type === 'application/pdf') {
					console.log(`🔄 Extraient text de PDF amb PDFRest: ${file.name}`);
					content = await extractPDFWithPDFRest(buffer, file.name);

					if (!content || content.trim().length < 50) {
						throw new Error("No s'ha pogut extreure prou text del PDF");
					}
				} else if (
					file.type.includes('word') ||
					file.name.endsWith('.docx') ||
					file.name.endsWith('.doc')
				) {
					console.log(`📝 Processant document Word: ${file.name}`);
					const result = await mammoth.extractRawText({ buffer });
					content = result.value;

					if (!content || content.trim().length < 10) {
						throw new Error('Document Word buit o sense contingut llegible');
					}
				} else if (file.type === 'text/plain') {
					console.log(`📄 Processant fitxer de text: ${file.name}`);
					content = buffer.toString('utf-8');

					if (!content || content.trim().length < 10) {
						throw new Error('Fitxer de text buit');
					}
				}

				content = cleanTextContent(content);

				processedFiles.push({
					name: file.name,
					content,
					type,
					success: true,
				});

				console.log(
					`✅ Fitxer processat amb èxit: ${file.name} (${content.length} caràcters)`,
				);
			} catch (error) {
				console.error(`❌ Error processant ${file.name}:`, error);

				processedFiles.push({
					name: file.name,
					content: '',
					type,
					success: false,
					error: error instanceof Error ? error.message : 'Error desconegut',
				});
			}
		}

		return NextResponse.json({
			success: true,
			files: processedFiles,
			summary: {
				total: files.length,
				successful: processedFiles.filter((f) => f.success).length,
				failed: processedFiles.filter((f) => !f.success).length,
			},
		});
	} catch (error) {
		console.error('Error general en el processament:', error);
		return NextResponse.json(
			{
				error: 'Error intern del servidor',
				details: error instanceof Error ? error.message : 'Error desconegut',
			},
			{ status: 500 },
		);
	}
}

async function extractPDFWithPDFRest(
	buffer: Buffer,
	filename: string,
): Promise<string> {
	try {
		console.log(`🌐 Enviant ${filename} a la API de PDFRest...`);

		const formData = new FormData();
		formData.append('file', buffer, {
			filename: filename,
			contentType: 'application/pdf',
		});
		formData.append('word_style', 'on');

		const config = {
			method: 'post' as const,
			maxBodyLength: Infinity,
			url: 'https://api.pdfrest.com/extracted-text',
			headers: {
				'Api-Key': PDFREST_API_KEY,
				...formData.getHeaders(),
			},
			data: formData,
			timeout: 30000,
		};

		const response = await axios(config);

		console.log(`📥 Resposta de PDFRest rebuda per a ${filename}`);

		if (!response.data) {
			throw new Error('Resposta buida de la API de PDFRest');
		}

		let extractedText = '';

		if (response.data.fullText) {
			extractedText = response.data.fullText.replaceAll(
				'[pdfRest Free Demo]',
				'',
			);
		} else {
			const dataStr = JSON.stringify(response.data);
			console.log(`🔍 Estructura de resposta PDFRest:`, response.data);
			throw new Error(
				`No s'ha trobat text a la resposta de PDFRest. Estructura: ${dataStr.substring(
					0,
					200,
				)}...`,
			);
		}

		if (!extractedText || extractedText.trim().length < 10) {
			throw new Error('PDFRest no ha pogut extreure prou text del PDF');
		}

		console.log(
			`✅ Text extret amb èxit de ${filename}: ${extractedText.length} caràcters`,
		);

		return extractedText;
	} catch (error) {
		console.error(`❌ Error amb la API de PDFRest per a ${filename}:`, error);

		if (axios.isAxiosError(error)) {
			const status = error.response?.status;
			const statusText = error.response?.statusText;
			const data = error.response?.data;

			console.error(
				`Error de la API de PDFRest - Status: ${status}, StatusText: ${statusText}`,
				data,
			);

			if (status === 401) {
				throw new Error('Clau API de PDFRest invàlida o no autoritzada');
			} else if (status === 413) {
				throw new Error('Fitxer PDF massa gran per a la API de PDFRest');
			} else if (status === 422) {
				throw new Error('Fitxer PDF corrupte o no vàlid');
			} else if (status === 429) {
				throw new Error(
					"S'ha excedit el límit de peticions de la API de PDFRest",
				);
			} else {
				throw new Error(
					`Error de la API de PDFRest: ${status} - ${
						statusText || 'Error desconegut'
					}`,
				);
			}
		}

		throw error;
	}
}

function cleanTextContent(text: string): string {
	return text
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/[ \t]+/g, ' ')
		.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
		.replace(/\s+/g, ' ')
		.split('\n')
		.map((line) => line.trim())
		.join('\n')
		.replace(/\n{2,}/g, '\n\n')
		.trim();
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
