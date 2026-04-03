import { InterfaceControl } from './interface-control';
import { ControlDescriptorOutput } from '../descriptors/control-descriptors';

export class ControlOutput extends InterfaceControl {
    private outputContainer: HTMLElement = null!;
    private lines: string[] = [];

    public get descriptor(): ControlDescriptorOutput {
        return this._descriptor as ControlDescriptorOutput;
    }

    constructor(descriptor: ControlDescriptorOutput, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        this.outputContainer = document.createElement('div');
        this.outputContainer.id = this.id;
        this.outputContainer.style.padding = '4px';
        this.outputContainer.style.boxSizing = 'border-box';
        this.outputContainer.style.fontFamily = this.descriptor.font_family.value || 'monospace';
        this.outputContainer.style.fontSize = this.descriptor.font_size.value > 0 ? `${this.descriptor.font_size.value}px` : '12px';
        this.outputContainer.style.whiteSpace = 'pre-wrap';
        this.outputContainer.style.wordWrap = 'break-word';
        this.outputContainer.style.backgroundColor = this.descriptor.background_color.value !== 'transparent'
            ? this.descriptor.background_color.value
            : '#ffffff';
        this.outputContainer.style.color = this.descriptor.text_color.value !== 'transparent'
            ? this.descriptor.text_color.value
            : '#000000';

        this.updateElementDescriptor();
        return this.outputContainer;
    }

    protected updateElementDescriptor(): void {
        super.updateElementDescriptor();

        if (!this.outputContainer) return;

        // Update styling
        this.outputContainer.style.backgroundColor = this.descriptor.background_color.value !== 'transparent'
            ? this.descriptor.background_color.value
            : '#ffffff';
        this.outputContainer.style.color = this.descriptor.text_color.value !== 'transparent'
            ? this.descriptor.text_color.value
            : '#000000';
        this.outputContainer.style.fontFamily = this.descriptor.font_family.value || 'monospace';
        this.outputContainer.style.fontSize = this.descriptor.font_size.value > 0 ? `${this.descriptor.font_size.value}px` : '12px';

        this.applyDMFLayout(this.outputContainer, this);
    }

    public output(value: string, data?: string): void {
        if (!this.outputContainer) return;

        // Replace tabs with spaces (4 spaces per tab)
        const processedValue = value.replace(/\t/g, '    ');

        // Create a new line element for this output
        const lineElement = document.createElement('div');
        lineElement.style.color = this.descriptor.text_color.value !== 'transparent'
            ? this.descriptor.text_color.value
            : '#000000';

        // Parse and add HTML content safely
        // For now, use textContent for safety and add innerHTML support for basic HTML
        if (processedValue.includes('<') && processedValue.includes('>')) {
            // Allow basic HTML tags while preventing injection
            lineElement.innerHTML = this.sanitizeHtml(processedValue);
        } else {
            lineElement.textContent = processedValue;
        }

        this.outputContainer.appendChild(lineElement);
        this.lines.push(processedValue);

        // Enforce max_lines limit
        const maxLines = this.descriptor.max_lines.value;
        if (this.lines.length > maxLines) {
            const excessLines = this.lines.length - maxLines;
            this.lines = this.lines.slice(excessLines);
            
            // Remove excess line elements from DOM
            const children = this.outputContainer.children;
            for (let i = 0; i < excessLines; i++) {
                children[0]?.remove();
            }
        }

        // Auto-scroll to bottom
        this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
    }

    private sanitizeHtml(html: string): string {
        // Allow only basic safe HTML tags
        const allowedTags = ['b', 'i', 'u', 'br', 'span', 'font', 'a', 'color'];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Simple sanitization - keep allowed tags
        const sanitize = (node: Node): string => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent || '';
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const tagName = el.tagName.toLowerCase();
                
                if (allowedTags.includes(tagName)) {
                    let sanitized = `<${tagName}`;
                    
                    // Preserve style and color attributes
                    if (el.style.color) {
                        sanitized += ` style="color: ${el.style.color};"`;
                    }
                    
                    sanitized += '>';
                    for (const child of el.childNodes) {
                        sanitized += sanitize(child);
                    }
                    sanitized += `</${tagName}>`;
                    return sanitized;
                } else {
                    // Skip disallowed tags but process children
                    let result = '';
                    for (const child of el.childNodes) {
                        result += sanitize(child);
                    }
                    return result;
                }
            }
            return '';
        };

        return sanitize(tempDiv);
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
