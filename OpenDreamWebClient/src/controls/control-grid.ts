import { InterfaceControl } from './interface-control';
import { ControlDescriptor } from '../descriptors/control-descriptors';

export class ControlGrid extends InterfaceControl {
    public rows = 0;
    public columns = 0;

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): unknown {
        return null;
    }

    public setCell(row: number, col: number, value: any): void {
        // placeholder
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
