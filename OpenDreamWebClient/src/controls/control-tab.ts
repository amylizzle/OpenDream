import { InterfaceControl } from './interface-control';
import { ControlDescriptorTab } from '../descriptors/control-descriptors';

export class ControlTab extends InterfaceControl {
    public get descriptor(): ControlDescriptorTab {
        return this._descriptor as ControlDescriptorTab;
    }

    constructor(descriptor: ControlDescriptorTab, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        return document.createElement('div');
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
