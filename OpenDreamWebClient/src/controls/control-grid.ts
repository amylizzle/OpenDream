import { InterfaceControl } from './interface-control';
import { ControlDescriptorGrid } from '../descriptors/control-descriptors';
import type { IDMFProperty } from '../DMF/dmf-property';

interface GridCell {
    content: string;
    html: boolean;
    atomRef?: string;
    colspan: number;
    rowspan: number;
}

export class ControlGrid extends InterfaceControl {
    private gridTable: HTMLTableElement = null!;
    private cells: GridCell[][] = [];
    private currentRow = 0;
    private currentCol = 0;

    public get descriptor(): ControlDescriptorGrid {
        return this._descriptor as ControlDescriptorGrid;
    }

    constructor(descriptor: ControlDescriptorGrid, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public CreateUIElement(): HTMLElement {
        const container = document.createElement('div');
        container.id = this.id;
        container.classList.add('GRID');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.overflow = 'auto';
        container.style.backgroundColor = this.descriptor.background_color.value;

        this.gridTable = document.createElement('table');
        this.gridTable.style.width = '100%';
        this.gridTable.style.height = '100%';
        this.gridTable.style.borderCollapse = 'collapse';
        this.gridTable.style.tableLayout = 'fixed';

        // Apply custom style if provided
        if (this.descriptor.style.value) {
            this.gridTable.style.cssText += this.descriptor.style.value;
        }

        container.appendChild(this.gridTable);

        this.initializeGrid();
        this.UpdateElementDescriptor();

        return container;
    }

    private initializeGrid(): void {
        const cols = this.descriptor.cells.x;
        const rows = this.descriptor.cells.y;

        if (cols <= 0 || rows <= 0) return;

        // Initialize cell data
        this.cells = [];
        for (let r = 0; r < rows; r++) {
            this.cells[r] = [];
            for (let c = 0; c < cols; c++) {
                this.cells[r][c] = {
                    content: '',
                    html: false,
                    colspan: 1,
                    rowspan: 1
                };
            }
        }

        this.renderGrid();
    }

    private renderGrid(): void {
        this.gridTable.innerHTML = '';

        const cols = this.descriptor.cells.x;
        const rows = this.descriptor.cells.y;

        if (cols <= 0 || rows <= 0) return;

        // Create table rows and cells
        for (let r = 0; r < rows; r++) {
            const tr = document.createElement('tr');
            tr.style.height = this.descriptor.is_list.value ? 'auto' : `${100 / rows}%`;

            for (let c = 0; c < cols; c++) {
                const cell = this.cells[r][c];
                if (!cell) continue;

                // Skip cells that are spanned over
                if (cell.colspan === 0 && cell.rowspan === 0) continue;

                const td = document.createElement('td');
                td.style.border = this.getBorderStyle();
                td.style.padding = '2px';
                td.style.verticalAlign = 'top';
                td.style.color = this.descriptor.text_color.value;
                td.style.fontFamily = this.descriptor.font_family.value || 'inherit';
                td.style.fontSize = this.descriptor.font_size.value > 0 ? `${this.descriptor.font_size.value}px` : 'inherit';
                td.style.fontWeight = this.descriptor.font_style.value.includes('bold') ? 'bold' : 'normal';
                td.style.fontStyle = this.descriptor.font_style.value.includes('italic') ? 'italic' : 'normal';
                td.style.textDecoration = this.descriptor.font_style.value.includes('underline') ? 'underline' :
                                        this.descriptor.font_style.value.includes('strike') ? 'line-through' : 'none';

                // Set colspan/rowspan
                if (cell.colspan > 1) td.colSpan = cell.colspan;
                if (cell.rowspan > 1) td.rowSpan = cell.rowspan;

                // Set content
                if (cell.html) {
                    td.innerHTML = this.sanitizeHtml(cell.content);
                } else {
                    td.textContent = cell.content;
                }

                // Handle atom display
                if (cell.atomRef) {
                    this.renderAtomInCell(td, cell);
                }

                // Highlight current cell
                if (r === this.currentRow && c === this.currentCol) {
                    td.style.backgroundColor = this.descriptor.highlight_color.value;
                }

                tr.appendChild(td);
            }

            this.gridTable.appendChild(tr);
        }
    }

    private getBorderStyle(): string {
        if (!this.descriptor.show_lines.value) return 'none';

        return `1px solid ${this.descriptor.line_color.value}`;
    }

    private sanitizeHtml(html: string): string {
        // Basic HTML sanitization for grid - only allow limited tags
        // This is a simplified implementation
        return html
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            // Allow only img, a, b, i, u, s tags
            .replace(/<(?!\/?(img|a|b|i|u|s)\b)[^>]*>/gi, '');
    }

    private renderAtomInCell(cellElement: HTMLTableCellElement, cell: GridCell): void {
        // For now, just show the atom name if show-names is enabled
        if (this.descriptor.show_names.value && cell.atomRef) {
            const nameDiv = document.createElement('div');
            nameDiv.textContent = cell.atomRef; // This should be the atom name
            nameDiv.style.fontSize = this.descriptor.small_icons.value ? '10px' : '12px';
            cellElement.appendChild(nameDiv);
        }

        // TODO: Add icon rendering when icon system is available
        // For now, just show text representation
    }

    protected UpdateElementDescriptor(): void {
        

        // Re-initialize grid if cells changed
        const newCols = this.descriptor.cells.x;
        const newRows = this.descriptor.cells.y;

        if (newCols !== this.cells[0]?.length || newRows !== this.cells.length) {
            this.initializeGrid();
        } else {
            this.renderGrid();
        }

        // Update current cell
        this.currentRow = Math.max(0, Math.min(this.descriptor.current_cell.y - 1, this.descriptor.cells.y - 1));
        this.currentCol = Math.max(0, Math.min(this.descriptor.current_cell.x - 1, this.descriptor.cells.x - 1));
        this.ApplyDMFLayout(this.gridTable, this);
    }

    public output(value: string, data?: string): void {
        if (this.descriptor.cells.x <= 0 || this.descriptor.cells.y <= 0) return;

        // Handle cell addressing like "grid:3,2"
        let targetRow = this.currentRow;
        let targetCol = this.currentCol;

        if (data && data.includes(':')) {
            const parts = data.split(':')[1].split(',');
            if (parts.length >= 2) {
                targetCol = parseInt(parts[0]) - 1; // 1-based to 0-based
                targetRow = parseInt(parts[1]) - 1;
            }
        }

        // Ensure valid cell coordinates
        targetRow = Math.max(0, Math.min(targetRow, this.descriptor.cells.y - 1));
        targetCol = Math.max(0, Math.min(targetCol, this.descriptor.cells.x - 1));

        // Update cell content
        if (this.cells[targetRow] && this.cells[targetRow][targetCol]) {
            this.cells[targetRow][targetCol].content = value;
            this.cells[targetRow][targetCol].html = false; // Assume plain text unless specified
        }

        this.renderGrid();
    }

    public outputAtom(atomRef: string, data?: string): void {
        if (this.descriptor.cells.x <= 0 || this.descriptor.cells.y <= 0) return;

        let targetRow = this.currentRow;
        let targetCol = this.currentCol;

        if (data && data.includes(':')) {
            const parts = data.split(':')[1].split(',');
            if (parts.length >= 2) {
                targetCol = parseInt(parts[0]) - 1;
                targetRow = parseInt(parts[1]) - 1;
            }
        }

        targetRow = Math.max(0, Math.min(targetRow, this.descriptor.cells.y - 1));
        targetCol = Math.max(0, Math.min(targetCol, this.descriptor.cells.x - 1));

        if (this.cells[targetRow] && this.cells[targetRow][targetCol]) {
            this.cells[targetRow][targetCol].atomRef = atomRef;
        }

        this.renderGrid();
    }


    public SetProperty(property: string, value: string, manualWinset = false): void {
        super.SetProperty(property, value, manualWinset);

        switch (property) {
            case 'cells':
                const parts = value.split('x');
                if (parts.length === 2) {
                    const cols = parseInt(parts[0]);
                    const rows = parseInt(parts[1]);
                    this.descriptor.cells.x = cols;
                    this.descriptor.cells.y = rows;
                    this.initializeGrid();
                }
                break;
            case 'current-cell':
                const cellParts = value.split(',');
                if (cellParts.length === 2) {
                    this.currentCol = parseInt(cellParts[0]) - 1;
                    this.currentRow = parseInt(cellParts[1]) - 1;
                    this.renderGrid();
                }
                break;
            case 'cell-span':
                const spanParts = value.split('x');
                if (spanParts.length === 2) {
                    const colspan = parseInt(spanParts[0]);
                    const rowspan = parseInt(spanParts[1]);
                    const cell = this.cells[this.currentRow]?.[this.currentCol];
                    if (cell) {
                        cell.colspan = colspan;
                        cell.rowspan = rowspan;
                        this.renderGrid();
                    }
                }
                break;
            default:
                // Re-render for any style changes
                if (['style', 'show-lines', 'highlight-color', 'line-color', 'text-color', 'background-color'].includes(property)) {
                    this.renderGrid();
                }
                break;
        }
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
