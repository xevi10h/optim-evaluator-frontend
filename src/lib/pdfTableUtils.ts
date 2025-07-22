import jsPDF from 'jspdf';

export interface TableColumn {
	header: string;
	width: number;
	align?: 'left' | 'center' | 'right';
}

export interface TableRow {
	cells: string[];
}

export class PDFTableUtils {
	private doc: jsPDF;
	private margin: number;
	private contentWidth: number;

	constructor(doc: jsPDF, margin: number, contentWidth: number) {
		this.doc = doc;
		this.margin = margin;
		this.contentWidth = contentWidth;
	}

	private cleanText(text: string): string {
		return text
			.replace(/[^\x20-\x7E]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	drawTable(
		columns: TableColumn[],
		rows: TableRow[],
		startY: number,
		options: {
			headerHeight?: number;
			rowHeight?: number;
			fontSize?: number;
			headerFontSize?: number;
			maxRowsPerPage?: number;
		} = {},
	): number {
		const {
			headerHeight = 12,
			rowHeight = 10,
			fontSize = 8,
			headerFontSize = 9,
			maxRowsPerPage = 20,
		} = options;

		let currentY = startY;

		const totalTableWidth = Math.min(
			this.contentWidth,
			columns.reduce((sum, col) => sum + col.width, 0),
		);

		const scaleFactor = this.contentWidth / totalTableWidth;
		const scaledColumns = columns.map((col) => ({
			...col,
			width: col.width * scaleFactor,
		}));

		this.drawTableHeader(scaledColumns, currentY, headerHeight, headerFontSize);
		currentY += headerHeight;

		let rowCount = 0;
		for (const row of rows) {
			if (rowCount >= maxRowsPerPage) {
				break;
			}

			this.drawTableRow(scaledColumns, row, currentY, rowHeight, fontSize);
			currentY += rowHeight;
			rowCount++;
		}

		this.drawTableBorders(scaledColumns, startY, currentY);

		return currentY;
	}

	private drawTableHeader(
		columns: TableColumn[],
		y: number,
		height: number,
		fontSize: number,
	): void {
		this.doc.setFillColor(223, 231, 230);
		this.doc.rect(this.margin, y, this.contentWidth, height, 'F');

		this.doc.setFontSize(fontSize);
		this.doc.setTextColor(28, 28, 28);
		this.doc.setFont('helvetica', 'bold');

		let currentX = this.margin;
		columns.forEach((column) => {
			const cleanHeader = this.cleanText(column.header);
			const lines = this.doc.splitTextToSize(cleanHeader, column.width - 4);

			let textX = currentX + 2;
			if (column.align === 'center') {
				textX = currentX + column.width / 2;
			} else if (column.align === 'right') {
				textX = currentX + column.width - 2;
			}

			this.doc.text(lines[0] || '', textX, y + height - 3, {
				align: column.align || 'left',
			});

			currentX += column.width;
		});
	}

	private drawTableRow(
		columns: TableColumn[],
		row: TableRow,
		y: number,
		height: number,
		fontSize: number,
	): void {
		this.doc.setFontSize(fontSize);
		this.doc.setTextColor(28, 28, 28);
		this.doc.setFont('helvetica', 'normal');

		let currentX = this.margin;
		columns.forEach((column, index) => {
			if (index < row.cells.length) {
				const cleanCell = this.cleanText(row.cells[index]);
				const lines = this.doc.splitTextToSize(cleanCell, column.width - 4);

				let textX = currentX + 2;
				if (column.align === 'center') {
					textX = currentX + column.width / 2;
				} else if (column.align === 'right') {
					textX = currentX + column.width - 2;
				}

				this.doc.text(lines[0] || '', textX, y + height - 3, {
					align: column.align || 'left',
				});
			}

			currentX += column.width;
		});
	}

	private drawTableBorders(
		columns: TableColumn[],
		startY: number,
		endY: number,
	): void {
		this.doc.setDrawColor(200, 200, 200);
		this.doc.setLineWidth(0.5);

		this.doc.rect(this.margin, startY, this.contentWidth, endY - startY);

		let currentX = this.margin;
		columns.forEach((column, index) => {
			if (index > 0) {
				this.doc.line(currentX, startY, currentX, endY);
			}
			currentX += column.width;
		});
	}

	createComparisonTable(
		criteriaComparisons: Array<{
			criterion: string;
			proposals: Array<{
				proposalName: string;
				companyName: string | null;
				score: string;
				position: number;
			}>;
		}>,
		proposalNames: string[],
		startY: number,
	): number {
		const cleanProposalNames = proposalNames.map((name) =>
			this.cleanText(name),
		);

		const criterionColWidth = Math.min(80, this.contentWidth * 0.5);
		const proposalColWidth =
			(this.contentWidth - criterionColWidth) / proposalNames.length;

		const columns: TableColumn[] = [
			{ header: 'Criteri', width: criterionColWidth, align: 'left' },
			...cleanProposalNames.map((name) => ({
				header: name,
				width: proposalColWidth,
				align: 'center' as const,
			})),
		];

		const rows: TableRow[] = criteriaComparisons.map((criterionComp) => {
			const cells = [criterionComp.criterion];

			criterionComp.proposals.forEach((proposal) => {
				const positionIcon = this.getPositionText(proposal.position);
				const scoreText = this.getScoreText(proposal.score);
				cells.push(`${positionIcon} ${scoreText}`);
			});

			return { cells };
		});

		return this.drawTable(columns, rows, startY, {
			headerHeight: 15,
			rowHeight: 16,
			fontSize: 7,
			headerFontSize: 8,
			maxRowsPerPage: 25,
		});
	}

	private getPositionText(position: number): string {
		switch (position) {
			case 1:
				return '1r';
			case 2:
				return '2n';
			case 3:
				return '3r';
			default:
				return `${position}è`;
		}
	}

	private getScoreText(score: string): string {
		switch (score) {
			case 'COMPLEIX_EXITOSAMENT':
				return 'COMP';
			case 'REGULAR':
				return 'REG';
			case 'INSUFICIENT':
				return 'INS';
			default:
				return score.substring(0, 4);
		}
	}
}
