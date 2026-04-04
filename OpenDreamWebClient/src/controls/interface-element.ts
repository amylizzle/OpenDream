import { ElementDescriptor } from '../descriptors/control-descriptors';
import { type IDMFProperty, DMFPropertyString, DMFPropertyNum, DMFPropertyBool, DMFPropertyColor, DMFPropertyPos, DMFPropertySize } from '../DMF/dmf-property';

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

    // make sure to call ApplyDMFLayout on InterfaceControls after updating the descriptor to update the position/size of the element
    protected abstract UpdateElementDescriptor(): void 

    public AddChild(descriptor: ElementDescriptor): void {
        throw new Error(`${this.constructor.name} cannot add children`);
    }

    public Shutdown(): void {
        // Clean up resources if required.
    }

    public Output(value: string, data?: string): void {
        // For output-based controls
        throw new Error(`${this.constructor.name} cannot output data`);
    }

    public TryGetProperty(property: string): IDMFProperty | undefined {
        // Convert property name to underscore case
        const underscoreKey = property.replace(/-/g, "_").toLowerCase();
        const prop = (this.descriptor as any)[underscoreKey];
        return prop;
    }

    public SetProperty(property: string, value: string, _manualWinset = false): void {
        // Convert property name to underscore case
        const underscoreKey = property.replace(/-/g, "_").toLowerCase();

        // Get the existing property to determine its type
        const existingProp = (this.descriptor as any)[underscoreKey];

        if (existingProp !== undefined) {
            // Determine the property type and create a new instance
            if (existingProp instanceof DMFPropertyString) {
                (this.descriptor as any)[underscoreKey] = new DMFPropertyString(value);
            } else if (existingProp instanceof DMFPropertyNum) {
                (this.descriptor as any)[underscoreKey] = new DMFPropertyNum(value);
            } else if (existingProp instanceof DMFPropertyBool) {
                (this.descriptor as any)[underscoreKey] = new DMFPropertyBool(value);
            } else if (existingProp instanceof DMFPropertyColor) {
                (this.descriptor as any)[underscoreKey] = new DMFPropertyColor(value);
            } else if (existingProp instanceof DMFPropertyPos) {
                (this.descriptor as any)[underscoreKey] = new DMFPropertyPos(value);
            } else if (existingProp instanceof DMFPropertySize) {
                (this.descriptor as any)[underscoreKey] = new DMFPropertySize(value);
            } else {
                console.warn(`Unknown property type for ${underscoreKey} in ${this.constructor.name}`);
                (this.descriptor as any)[underscoreKey] = value;
            }

            // Update UI representation after property change
            this.UpdateElementDescriptor();
        } else {
            console.warn(`Property ${underscoreKey} does not exist on ${this.constructor.name} descriptor`);
        }
    }
}
