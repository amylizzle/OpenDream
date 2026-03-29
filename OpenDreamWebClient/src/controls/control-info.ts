import { InterfaceControl } from './interface-control';
import { ControlDescriptorInfo } from '../descriptors/control-descriptors';

export class ControlInfo extends InterfaceControl {
    public get descriptor(): ControlDescriptorInfo {
        return this._descriptor as ControlDescriptorInfo;
    }

    constructor(descriptor: ControlDescriptorInfo, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        return document.createElement('div');
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
