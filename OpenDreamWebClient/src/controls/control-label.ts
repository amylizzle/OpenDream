import { InterfaceControl } from './interface-control';
import { ControlDescriptorLabel } from '../descriptors/control-descriptors';

export class ControlLabel extends InterfaceControl {
    private container: HTMLElement = null!;
    private label: HTMLElement = null!;

    public get descriptor(): ControlDescriptorLabel {
        return this._descriptor as ControlDescriptorLabel;
    }

    constructor(descriptor: ControlDescriptorLabel, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public CreateUIElement(): HTMLElement {
        this.container = document.createElement('div');
        this.container.id = this.id;
        this.container.classList.add('LABEL');
        
        
        
        this.container.style.padding = '4px';
        this.container.style.backgroundColor = this.descriptor.background_color.value !== 'transparent' 
            ? this.descriptor.background_color.value 
            : 'transparent';
        this.container.style.border = '1px solid #ccc';
        this.container.style.boxSizing = 'border-box';

        this.label = document.createElement('span');
        this.label.style.whiteSpace = this.descriptor.text_wrap.value ? 'normal' : 'nowrap';
        this.label.style.overflow = 'scroll';
        this.label.style.textOverflow = 'ellipsis';
        this.label.style.fontSize = this.descriptor.font_size.value > 0 ? `${this.descriptor.font_size.value}px` : 'inherit';
        this.label.style.fontFamily = this.descriptor.font_family.value || 'inherit';
        this.label.style.fontStyle = this.descriptor.font_style.value || 'inherit';

        this.container.appendChild(this.label);
        this.UpdateElementDescriptor();
        return this.container;
    }

    protected UpdateElementDescriptor(): void {
        

        if (!this.label) return;

        // Update text content
        this.label.textContent = this.descriptor.text.value;

        // Update text color
        if (this.descriptor.text_color.value !== 'transparent') {
            this.label.style.color = this.descriptor.text_color.value;
        } else {
            this.label.style.color = '#000000';
        }

        // Update background color
        this.container.style.backgroundColor = this.descriptor.background_color.value !== 'transparent'
            ? this.descriptor.background_color.value
            : 'transparent';

        // Update wrapping
        this.label.style.whiteSpace = this.descriptor.text_wrap.value ? 'normal' : 'nowrap';

        // Apply alignment
        const align = this.descriptor.align.value.toLowerCase();
        this.applyAlignment(align);
        this.ApplyDMFLayout(this.container, this);
    }

    private applyAlignment(align: string): void {
        // Map alignment values to flexbox properties
        const alignmentMap: { [key: string]: { justifyContent: string; alignItems: string } } = {
            'center': { justifyContent: 'center', alignItems: 'center' },
            'left': { justifyContent: 'flex-start', alignItems: 'center' },
            'right': { justifyContent: 'flex-end', alignItems: 'center' },
            'top': { justifyContent: 'center', alignItems: 'flex-start' },
            'bottom': { justifyContent: 'center', alignItems: 'flex-end' },
            'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start' },
            'top-right': { justifyContent: 'flex-end', alignItems: 'flex-start' },
            'bottom-left': { justifyContent: 'flex-start', alignItems: 'flex-end' },
            'bottom-right': { justifyContent: 'flex-end', alignItems: 'flex-end' }
        };

        const alignment = alignmentMap[align] || alignmentMap['center'];
        this.container.style.justifyContent = alignment.justifyContent;
        this.container.style.alignItems = alignment.alignItems;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
