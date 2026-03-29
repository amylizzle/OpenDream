import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlBar extends InterfaceControl {
    public isOpen = false;

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        // TODO: create and return actual DOM or canvas control element
        return null;
    }

    public toggle(): void {
        this.isOpen = !this.isOpen;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
