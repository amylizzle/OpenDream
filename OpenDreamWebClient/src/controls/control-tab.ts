import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlTab extends InterfaceControl {
    public selectedIndex = 0;

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        return null;
    }

    public select(index: number): void {
        this.selectedIndex = index;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
