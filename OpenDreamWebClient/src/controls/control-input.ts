import { InterfaceControl } from './interface-control';
import { ControlDescriptorInput } from '../descriptors/control-descriptors';

export class ControlInput extends InterfaceControl {
    private inputElement: HTMLInputElement | HTMLTextAreaElement = null!;
    private container: HTMLElement = null!;
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;

    public get descriptor(): ControlDescriptorInput {
        return this._descriptor as ControlDescriptorInput;
    }

    constructor(descriptor: ControlDescriptorInput, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        this.container = document.createElement('div');
        this.container.classList.add('INPUT');
        this.container.id = this.id;
        
        this.container.style.padding = '4px';
        this.container.style.boxSizing = 'border-box';

        // Create input or textarea based on multi_line
        if (this.descriptor.multi_line.value) {
            this.inputElement = document.createElement('textarea');
        } else {
            this.inputElement = document.createElement('input');
            (this.inputElement as HTMLInputElement).type = this.descriptor.is_password.value ? 'password' : 'text';
        }

        this.inputElement.style.width = '100%';
        this.inputElement.style.height = this.descriptor.multi_line.value ? '100%' : 'auto';
        this.inputElement.style.padding = '4px';
        this.inputElement.style.border = '1px solid #ccc';
        this.inputElement.style.fontFamily = this.descriptor.font_family.value || 'monospace';
        this.inputElement.style.fontSize = this.descriptor.font_size.value > 0 ? `${this.descriptor.font_size.value}px` : '12px';
        this.inputElement.style.color = this.descriptor.text_color.value !== 'transparent'
            ? this.descriptor.text_color.value
            : '#000000';
        this.inputElement.style.backgroundColor = this.descriptor.background_color.value !== 'transparent'
            ? this.descriptor.background_color.value
            : '#ffffff';
        this.inputElement.style.resize = 'none';

        // Only set up key handler for single-line inputs
        if (!(this.inputElement instanceof HTMLTextAreaElement)) {
            this.keyHandler = this.handleKeyDown.bind(this);
            this.inputElement.addEventListener('keydown', this.keyHandler);
        }

        this.container.appendChild(this.inputElement);
        this.updateElementDescriptor();
        return this.container;
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.onTextEntered(this.inputElement.value);
        }
    }

    protected updateElementDescriptor(): void {
        if (!this.inputElement) return;

        // Update styling
        this.inputElement.style.color = this.descriptor.text_color.value !== 'transparent'
            ? this.descriptor.text_color.value
            : '#000000';
        this.inputElement.style.backgroundColor = this.descriptor.background_color.value !== 'transparent'
            ? this.descriptor.background_color.value
            : '#ffffff';
        this.inputElement.style.fontFamily = this.descriptor.font_family.value || 'monospace';
        this.inputElement.style.fontSize = this.descriptor.font_size.value > 0 ? `${this.descriptor.font_size.value}px` : '12px';

        // Update password type if needed
        if (this.inputElement instanceof HTMLInputElement) {
            this.inputElement.type = this.descriptor.is_password.value ? 'password' : 'text';
        }

        this.resetText();
        this.applyDMFLayout(this.container, this);
    }

    private onTextEntered(text: string): void {
        if (this.descriptor.no_command.value) {
            return;
        }

        this.resetText();

        const command = this.descriptor.command.value;
        let fullCommand: string;

        if (command.startsWith('!')) {
            fullCommand = text;
        } else {
            fullCommand = command + text;
        }

        // Execute the command via the interface manager
        this.windowControl?.windowControl?.InterfaceManager?.RunCommand(fullCommand);
    }

    private resetText(): void {
        const command = this.descriptor.command.value;

        if (command.startsWith('!')) {
            this.inputElement.value = command.substring(1);
        } else {
            this.inputElement.value = '';
        }
    }

    public tryGetProperty(property: string): unknown {
        switch (property) {
            case 'text':
                return this.inputElement.value;
            default:
                return super.tryGetProperty(property);
        }
    }

    public setProperty(property: string, value: string, manualWinset = false): void {
        switch (property) {
            case 'focus':
                if (value === 'true' || value === '1') {
                    this.inputElement.focus();
                }
                break;
            case 'text':
                this.inputElement.value = value;
                break;
            default:
                super.setProperty(property, value, manualWinset);
                break;
        }
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
