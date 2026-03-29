import { InterfaceControl } from './interface-control';
import { ControlDescriptorChild } from '../descriptors/control-descriptors';

export class ControlChild extends InterfaceControl {
    public get descriptor(): ControlDescriptorChild {
        return this._descriptor as ControlDescriptorChild;
    }

    constructor(descriptor: ControlDescriptorChild, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        return document.createElement('div');
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
