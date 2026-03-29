import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlBrowser extends InterfaceControl {
    public url = '';

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        return null;
    }

    public navigate(url: string): void {
        this.url = url;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
