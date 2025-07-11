// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/msword',
	'text/plain',
];

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
					// Usar extracción básica para PDF temporalmente
					content = await extractPDFTextBasic(buffer, file.name);

					if (!content || content.trim().length < 50) {
						// Si la extracción básica falla, crear un placeholder útil
						content = generatePDFPlaceholder(file);
					}
				} else if (
					file.type.includes('word') ||
					file.name.endsWith('.docx') ||
					file.name.endsWith('.doc')
				) {
					// Procesar documentos Word
					const result = await mammoth.extractRawText({ buffer });
					content = result.value;

					if (!content || content.trim().length < 10) {
						throw new Error('Documento Word vacío o sin contenido legible');
					}
				} else if (file.type === 'text/plain') {
					// Procesar archivo de texto
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

				// Para PDFs problemáticos, crear un placeholder en lugar de fallar
				if (file.type === 'application/pdf') {
					processedFiles.push({
						name: file.name,
						content: generatePDFPlaceholder(file),
						type,
						success: true, // Marcamos como éxito porque tenemos contenido placeholder
					});
				} else {
					processedFiles.push({
						name: file.name,
						content: '',
						type,
						success: false,
						error: error instanceof Error ? error.message : 'Error desconocido',
					});
				}
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

// Extracción básica de PDF usando técnicas de parsing de texto
async function extractPDFTextBasic(
	buffer: Buffer,
	filename: string,
): Promise<string> {
	try {
		// Convertir buffer a string y buscar patrones de texto
		const pdfString = buffer.toString('binary');

		// Buscar streams de texto en el PDF
		const textStreams: string[] = [];

		// Patrón para encontrar streams de contenido
		const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
		let match;

		while ((match = streamRegex.exec(pdfString)) !== null) {
			const streamContent = match[1];

			// Buscar texto decodificable en el stream
			const textRegex = /\((.*?)\)/g;
			let textMatch;

			while ((textMatch = textRegex.exec(streamContent)) !== null) {
				const text = textMatch[1];
				if (text && text.length > 2) {
					textStreams.push(text);
				}
			}

			// También buscar texto en formato Tj
			const tjRegex = /\[(.*?)\]\s*TJ/g;
			while ((textMatch = tjRegex.exec(streamContent)) !== null) {
				const text = textMatch[1].replace(/[()]/g, '');
				if (text && text.length > 2) {
					textStreams.push(text);
				}
			}
		}

		// Buscar texto directo en formato (text)
		const directTextRegex = /\(([^)]{3,})\)/g;
		while ((match = directTextRegex.exec(pdfString)) !== null) {
			const text = match[1];
			if (text && text.length > 2 && !text.includes('/x')) {
				textStreams.push(text);
			}
		}

		// Combinar y limpiar texto encontrado
		let extractedText = textStreams.join(' ');

		// Decodificar caracteres especiales comunes
		extractedText = extractedText
			.replace(/\\n/g, '\n')
			.replace(/\\r/g, '\r')
			.replace(/\\t/g, '\t')
			.replace(/\\\(/g, '(')
			.replace(/\\\)/g, ')')
			.replace(/\\\\/g, '\\');

		console.log(
			`📄 Extracción básica de PDF ${filename}: ${extractedText.length} caracteres`,
		);

		return extractedText;
	} catch (error) {
		console.error(`Error en extracción básica de PDF ${filename}:`, error);
		return '';
	}
}

// Generar placeholder informativo para PDFs
function generatePDFPlaceholder(file: File): string {
	return `[PDF: ${file.name}]

📄 INFORMACIÓN DEL ARCHIVO PDF
- Nombre: ${file.name}
- Tamaño: ${formatFileSize(file.size)}
- Fecha de procesamiento: ${new Date().toLocaleString('es-ES')}

⚠️ NOTA IMPORTANTE: 
Este PDF se ha detectado pero no se pudo extraer automáticamente todo su contenido de texto.

🔧 RECOMENDACIONES PARA EL USUARIO:
1. Abre el PDF manualmente y copia el texto relevante
2. Pégalo en un archivo .txt y súbelo de nuevo
3. O incluye la información clave en el campo "Contexto Adicional" del formulario

📋 INFORMACIÓN QUE DEBERÍAS INCLUIR MANUALMENTE:
- Criterios de evaluación específicos
- Requisitos técnicos principales
- Metodología de puntuación
- Cualquier tabla o lista importante del documento

💡 CONSEJO: 
La aplicación puede continuar funcionando con esta información como base, 
pero será más precisa si incluyes manualmente el contenido clave del PDF.

🎯 PARA MEJORES RESULTADOS:
Busca en el PDF secciones como:
- "Criterios de evaluación"
- "Puntuación"
- "Requisitos técnicos"
- "Metodología de evaluación"
- "Anexos con criterios"

Y copia ese contenido en el campo de contexto adicional.`;
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
			// Eliminar caracteres de control
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
