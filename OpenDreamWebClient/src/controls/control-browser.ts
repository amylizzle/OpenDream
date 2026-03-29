import { InterfaceControl } from './interface-control';
import {  ControlDescriptorBrowser } from '../descriptors/control-descriptors';

export class ControlBrowser extends InterfaceControl {
    public get descriptor(): ControlDescriptorBrowser {
        return this._descriptor as ControlDescriptorBrowser;
    }


    constructor(descriptor: ControlDescriptorBrowser, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        return document.createElement('iframe');
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
