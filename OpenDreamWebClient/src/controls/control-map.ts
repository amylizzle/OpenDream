import { InterfaceControl } from './interface-control';
import { ControlDescriptorMap } from '../descriptors/control-descriptors';

export class ControlMap extends InterfaceControl {
    public get descriptor(): ControlDescriptorMap {
        return this._descriptor as ControlDescriptorMap;
    }

    constructor(descriptor: ControlDescriptorMap, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        return document.createElement('div');
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
