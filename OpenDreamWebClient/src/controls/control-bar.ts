import { InterfaceControl } from './interface-control';
import { ControlDescriptorBar } from '../descriptors/control-descriptors';
export class ControlBar extends InterfaceControl {
    public get descriptor(): ControlDescriptorBar {
        return this._descriptor as ControlDescriptorBar;
    }

    constructor(descriptor: ControlDescriptorBar, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        const barElement = document.createElement('div');
        barElement.classList.add('control-bar');
        return barElement;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
