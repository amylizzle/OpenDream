import { InterfaceControl } from './interface-control';
import { ControlDescriptorOutput } from '../descriptors/control-descriptors';

export class ControlOutput extends InterfaceControl {
    public get descriptor(): ControlDescriptorOutput {
        return this._descriptor as ControlDescriptorOutput;
    }

    constructor(descriptor: ControlDescriptorOutput, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        return document.createElement('div');
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
