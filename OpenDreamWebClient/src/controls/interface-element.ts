import { ElementDescriptor } from '../descriptors/control-descriptors';
//interface elements don't render themselves, unlike controls. They just hold descriptor data and helper functions for controls that render them.

export abstract class InterfaceElement {
    protected _descriptor: ElementDescriptor;

    // public get descriptor(): ElementDescriptor {
    //     return this._descriptor as ElementDescriptor;
    // }
    public set descriptor(value: ElementDescriptor) {
        this._descriptor = value;
    }

    constructor(descriptor: ElementDescriptor) {
        this._descriptor = descriptor;
    }

    get id(): string {
        return this._descriptor.id.asRaw();
    }

    get name(): string {
        return this._descriptor.name.asRaw();
    }
}
