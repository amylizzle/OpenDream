import { InterfaceControl } from './interface-control';
import { ControlDescriptorGrid } from '../descriptors/control-descriptors';

export class ControlGrid extends InterfaceControl {
    public get descriptor(): ControlDescriptorGrid {
        return this._descriptor as ControlDescriptorGrid;
    }

    constructor(descriptor: ControlDescriptorGrid, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        return document.createElement('div');
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
