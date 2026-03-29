import { InterfaceControl } from './interface-control';
import { ControlDescriptorInput } from '../descriptors/control-descriptors';

export class ControlInput extends InterfaceControl {
    public get descriptor(): ControlDescriptorInput {
        return this._descriptor as ControlDescriptorInput;
    }

    constructor(descriptor: ControlDescriptorInput, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement{
        return document.createElement('input');
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
