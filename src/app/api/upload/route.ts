// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import FormData from 'form-data';
import axios from 'axios';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/msword',
	'text/plain',
];

// API Key de PDFRest
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
				{ error: 'No se han proporcionado archivos' },
				{ status: 400 },
			);
		}

		if (!type || !['specification', 'proposal'].includes(type)) {
			return NextResponse.json(
				{ error: 'Tipo de archivo no válido' },
				{ status: 400 },
			);
		}

		const processedFiles: ProcessedFile[] = [];

		for (const file of files) {
			try {
				console.log(`📄 Procesando archivo: ${file.name}`);

				// Validar archivo
				if (file.size > MAX_FILE_SIZE) {
					processedFiles.push({
						name: file.name,
						content: '',
						type,
						success: false,
						error: `Archivo demasiado grande: ${file.name} (máximo 10MB)`,
					});
					continue;
				}

				if (!SUPPORTED_TYPES.includes(file.type)) {
					processedFiles.push({
						name: file.name,
						content: '',
						type,
						success: false,
						error: `Tipo de archivo no soportado: ${file.type}`,
					});
					continue;
				}

				// Procesar archivo según su tipo
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				let content = '';

				if (file.type === 'application/pdf') {
					console.log(`🔄 Extrayendo texto de PDF con PDFRest: ${file.name}`);
					content = await extractPDFWithPDFRest(buffer, file.name);

					if (!content || content.trim().length < 50) {
						throw new Error('No se pudo extraer texto suficiente del PDF');
					}
				} else if (
					file.type.includes('word') ||
					file.name.endsWith('.docx') ||
					file.name.endsWith('.doc')
				) {
					console.log(`📝 Procesando documento Word: ${file.name}`);
					const result = await mammoth.extractRawText({ buffer });
					content = result.value;

					if (!content || content.trim().length < 10) {
						throw new Error('Documento Word vacío o sin contenido legible');
					}
				} else if (file.type === 'text/plain') {
					console.log(`📄 Procesando archivo de texto: ${file.name}`);
					content = buffer.toString('utf-8');

					if (!content || content.trim().length < 10) {
						throw new Error('Archivo de texto vacío');
					}
				}

				// Limpiar y normalizar el contenido
				content = cleanTextContent(content);

				processedFiles.push({
					name: file.name,
					content,
					type,
					success: true,
				});

				console.log(
					`✅ Archivo procesado exitosamente: ${file.name} (${content.length} caracteres)`,
				);
			} catch (error) {
				console.error(`❌ Error procesando ${file.name}:`, error);

				processedFiles.push({
					name: file.name,
					content: '',
					type,
					success: false,
					error: error instanceof Error ? error.message : 'Error desconocido',
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
		console.error('Error general en el procesamiento:', error);
		return NextResponse.json(
			{
				error: 'Error interno del servidor',
				details: error instanceof Error ? error.message : 'Error desconocido',
			},
			{ status: 500 },
		);
	}
}

// Función para extraer texto de PDF usando PDFRest API
async function extractPDFWithPDFRest(
	buffer: Buffer,
	filename: string,
): Promise<string> {
	try {
		console.log(`🌐 Enviando ${filename} a PDFRest API...`);

		// Crear FormData para enviar a PDFRest
		const formData = new FormData();
		formData.append('file', buffer, {
			filename: filename,
			contentType: 'application/pdf',
		});
		formData.append('word_style', 'on');

		// Configurar la petición a PDFRest
		const config = {
			method: 'post' as const,
			maxBodyLength: Infinity,
			url: 'https://api.pdfrest.com/extracted-text',
			headers: {
				'Api-Key': PDFREST_API_KEY,
				...formData.getHeaders(),
			},
			data: formData,
			timeout: 30000, // 30 segundos timeout
		};

		// Realizar la petición
		const response = await axios(config);

		console.log(`📥 Respuesta de PDFRest recibida para ${filename}`);

		// Verificar la respuesta
		if (!response.data) {
			throw new Error('Respuesta vacía de PDFRest API');
		}

		// Extraer el texto de la respuesta
		let extractedText = '';

		if (response.data.fullText) {
			extractedText = response.data.fullText.replaceAll(
				'[pdfRest Free Demo]',
				'',
			);
		} else {
			// Si la estructura es diferente, intentar encontrar el texto
			const dataStr = JSON.stringify(response.data);
			console.log(`🔍 Estructura de respuesta PDFRest:`, response.data);
			throw new Error(
				`No se encontró texto en la respuesta de PDFRest. Estructura: ${dataStr.substring(
					0,
					200,
				)}...`,
			);
		}

		if (!extractedText || extractedText.trim().length < 10) {
			throw new Error('PDFRest no pudo extraer texto suficiente del PDF');
		}

		console.log(
			`✅ Texto extraído exitosamente de ${filename}: ${extractedText.length} caracteres`,
		);

		return extractedText;
	} catch (error) {
		console.error(`❌ Error con PDFRest API para ${filename}:`, error);

		// Si es un error de axios, obtener más detalles
		if (axios.isAxiosError(error)) {
			const status = error.response?.status;
			const statusText = error.response?.statusText;
			const data = error.response?.data;

			console.error(
				`PDFRest API Error - Status: ${status}, StatusText: ${statusText}`,
				data,
			);

			if (status === 401) {
				throw new Error('API Key de PDFRest inválida o no autorizada');
			} else if (status === 413) {
				throw new Error('Archivo PDF demasiado grande para PDFRest API');
			} else if (status === 422) {
				throw new Error('Archivo PDF corrupto o no válido');
			} else if (status === 429) {
				throw new Error('Límite de rate de PDFRest API excedido');
			} else {
				throw new Error(
					`Error de PDFRest API: ${status} - ${
						statusText || 'Error desconocido'
					}`,
				);
			}
		}

		throw error;
	}
}

// Función para limpiar y normalizar texto
function cleanTextContent(text: string): string {
	return (
		text
			// Normalizar espacios y saltos de línea
			.replace(/\r\n/g, '\n')
			.replace(/\r/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			.replace(/[ \t]+/g, ' ')
			// Eliminar caracteres de control excepto los básicos
			.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
			// Limpiar caracteres especiales mal decodificados
			.replace(/�/g, '')
			// Trim de cada línea
			.split('\n')
			.map((line) => line.trim())
			.join('\n')
			// Eliminar líneas vacías consecutivas
			.replace(/\n{2,}/g, '\n\n')
			.trim()
	);
}

// Función para formatear tamaño de archivo
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
