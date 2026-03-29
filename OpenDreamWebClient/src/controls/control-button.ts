import { InterfaceControl } from './interface-control';
import { ControlDescriptorButton } from '../descriptors/control-descriptors';

export class ControlButton extends InterfaceControl {
    public get descriptor(): ControlDescriptorButton {
        return this._descriptor as ControlDescriptorButton;
    }
    

    constructor(descriptor: ControlDescriptorButton, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        return document.createElement('button');
    }

    public click(): void {
        // Placeholder for on-click behavior
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
