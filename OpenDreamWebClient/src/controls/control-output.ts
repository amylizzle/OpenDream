import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlOutput extends InterfaceControl {
    public buffer: string[] = [];

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        return null;
    }

    public output(value: string, data?: string): void {
        this.buffer.push(value);
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
