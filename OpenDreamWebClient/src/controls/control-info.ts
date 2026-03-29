import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlInfo extends InterfaceControl {
    public text = '';

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        return null;
    }

    public setText(text: string): void {
        this.text = text;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
