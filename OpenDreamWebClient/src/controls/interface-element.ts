import { ElementDescriptor } from '../descriptors/control-descriptors';

export abstract class InterfaceElement {
    public descriptor: ElementDescriptor;

    constructor(descriptor: ElementDescriptor) {
        this.descriptor = descriptor;
    }

    get id(): string {
        return this.descriptor.id.value;
    }

    get name(): string {
        return this.descriptor.name.value;
    }
}
