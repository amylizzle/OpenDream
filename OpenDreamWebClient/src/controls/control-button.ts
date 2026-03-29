import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlButton extends InterfaceControl {
    public label = '';

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        return null;
    }

    public click(): void {
        // Placeholder for on-click behavior
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
