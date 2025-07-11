import { FileContent } from '@/types';

export async function processServerFiles(
	files: FileContent[],
): Promise<FileContent[]> {
	const processedFiles: FileContent[] = [];

	for (const file of files) {
		try {
			const cleanContent = cleanExtractedText(file.content);

			if (cleanContent.length < 50) {
				console.warn(
					`Contingut insuficient a ${file.name}: ${cleanContent.length} caràcters`,
				);
			}

			processedFiles.push({ ...file, content: cleanContent });
		} catch (error) {
			console.error(`Error processant ${file.name}:`, error);
			processedFiles.push(file);
		}
	}

	return processedFiles;
}

export function cleanExtractedText(text: string): string {
	return text
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/[ \t]+/g, ' ')
		.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
		.split('\n')
		.map((line) => line.trim())
		.join('\n')
		.replace(/\n{2,}/g, '\n\n')
		.trim();
}

export function getFileInfo(file: File) {
	const extension = file.name.split('.').pop()?.toLowerCase() || '';
	const isSupported = ['pdf', 'docx', 'doc', 'txt'].includes(extension);

	return {
		name: file.name,
		type: file.type || 'unknown',
		size: file.size,
		extension,
		isSupported,
		sizeFormatted: formatFileSize(file.size),
	};
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validateExtractedContent(
	content: string,
	filename: string,
): boolean {
	if (!content || content.trim().length < 50) {
		console.warn(
			`Contingut insuficient a ${filename}: ${content.length} caràcters`,
		);
		return false;
	}

	const meaningfulContent = content.replace(
		/[^a-zA-Z0-9àèéíòóúÀÈÉÍÒÓÚñÑçÇ]/g,
		'',
	).length;
	if (meaningfulContent < 50) {
		console.warn(`Contingut sense significat a ${filename}`);
		return false;
	}

	return true;
}
