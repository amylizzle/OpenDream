import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlMap extends InterfaceControl {
    public mapData: unknown = null;

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        return null;
    }

    public setMapData(data: unknown): void {
        this.mapData = data;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
