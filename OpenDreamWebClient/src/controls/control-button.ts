import { InterfaceControl } from './interface-control';
import { ControlDescriptorButton } from '../descriptors/control-descriptors';
import { DMFPropertyBool } from '../DMF/dmf-property';

export class ControlButton extends InterfaceControl {
    public get descriptor(): ControlDescriptorButton {
        return this._descriptor as ControlDescriptorButton;
    }
    

    constructor(descriptor: ControlDescriptorButton, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    protected updateElementDescriptor(): void {
        this.applyDMFLayout(document.getElementById(this.id)!, this);
    }    

    public createUIElement(): HTMLElement {
        const button = document.createElement('button');
        button.classList.add('BUTTON');
        button.id = this.id;
        const setButtonContent = () => {
            button.textContent = this.descriptor.text?.asRaw() ?? '';

            const imageValue = this.descriptor.image?.asRaw().trim();
            if (imageValue) {
                button.textContent = '';
                const img = document.createElement('img');
                img.src = imageValue.replace(/\\/g, '/');
                img.alt = this.descriptor.text?.asRaw() ?? '';
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.objectFit = 'contain';
                img.style.pointerEvents = 'none';
                button.appendChild(img);
            }
        };

        const updateCheckedStyle = () => {
            const checked = this.descriptor.is_checked?.value ?? false;
            if (checked) {
                button.classList.add('control-button-checked');
                button.style.filter = 'brightness(0.9)';
            } else {
                button.classList.remove('control-button-checked');
                button.style.filter = '';
            }
        };

        const updateButtonState = () => {
            setButtonContent();
            updateCheckedStyle();
            button.disabled = this.descriptor.is_disabled?.value ?? false;

            if (this.descriptor.background_color?.asRaw()) {
                button.style.backgroundColor = this.descriptor.background_color.asRaw();
            }

            if (this.descriptor.text_color?.asRaw()) {
                button.style.color = this.descriptor.text_color.asRaw();
            }

            if (this.descriptor.is_flat?.value) {
                button.style.border = 'none';
            } else {
                button.style.border = '';
            }

            if (this.descriptor.font_family?.asRaw()) {
                button.style.fontFamily = this.descriptor.font_family.asRaw();
            }

            if (this.descriptor.font_size?.value) {
                button.style.fontSize = `${this.descriptor.font_size.value}px`;
            }

            if (this.descriptor.font_style?.asRaw()) {
                button.style.fontStyle = this.descriptor.font_style.asRaw().includes('italic') ? 'italic' : '';
                button.style.fontWeight = this.descriptor.font_style.asRaw().includes('bold') ? 'bold' : '';
            }
        };

        button.addEventListener('click', () => {
            if (this.descriptor.button_type?.asRaw() === 'pushbox') {
                if (this.descriptor.is_checked) {
                    this.descriptor.is_checked = new DMFPropertyBool(!this.descriptor.is_checked.value);
                } else {
                    this.descriptor.is_checked = new DMFPropertyBool(true);
                }
                updateCheckedStyle();
            }

            const command = this.descriptor.command?.asRaw();
            if (command) {
                (this.windowControl as any)?.interfaceManager?.RunCommand(command);
            }
        });

        updateButtonState();
        return button;
    }

    public click(): void {
        // Placeholder for on-click behavior
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
