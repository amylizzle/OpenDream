import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlChild extends InterfaceControl {
    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        return null;
    }

    public addChild(descriptor: ControlDescriptor): void {
        // Child-specific behavior may support nested controls
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
