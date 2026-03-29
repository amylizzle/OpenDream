import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlInput extends InterfaceControl {
    public value = '';

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        return null;
    }

    public setValue(value: string): void {
        this.value = value;
    }

    public getValue(): string {
        return this.value;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
