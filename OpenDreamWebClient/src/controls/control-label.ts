import { InterfaceControl } from './interface-control';
import { ControlDescriptorLabel } from '../descriptors/control-descriptors';

export class ControlLabel extends InterfaceControl {
    public get descriptor(): ControlDescriptorLabel {
        return this._descriptor as ControlDescriptorLabel;
    }

    constructor(descriptor: ControlDescriptorLabel, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        return document.createElement('div');
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
