import { InterfaceElement } from './interface-element';
import { ControlDescriptor } from '../descriptors/control-descriptors';
import { DMFPropertyString, DMFPropertyNum, DMFPropertyBool, DMFPropertyColor, DMFPropertyPos, DMFPropertySize } from '../DMF/dmf-property';


export abstract class InterfaceControl extends InterfaceElement {
    public get descriptor(): ControlDescriptor {
        return this._descriptor as ControlDescriptor;
    }

    public windowControl?: ControlWindow;
        /// <summary>
    /// The position that anchor1 and anchor2 anchor themselves to.
    /// Updates when this control's size/pos is winset,
    /// or when this control's size is 0 and a sibling control's size/pos is winset
    /// </summary>
    public anchorPosition:{x: number, y: number} = {x: 0, y: 0};

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor);
        this.windowControl = windowControl;
    }

    public abstract createUIElement(): HTMLElement;

    protected updateElementDescriptor(): void {
        // TODO: Implementation in derived controls
    }

    public tryGetProperty(property: string): unknown {
        // Convert property name to underscore case
        const underscoreKey = property.replace(/-/g, "_").toLowerCase();
        const prop = (this.descriptor as any)[underscoreKey];

        if (prop?.asRaw) {
            // It's a DMFProperty, return the raw value
            return prop.asRaw();
        } else if (prop !== undefined) {
            return prop;
        }

        return "";
    }

    public setProperty(property: string, value: string, _manualWinset = false): void {
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
            this.updateElementDescriptor();
        } else {
            console.warn(`Property ${underscoreKey} does not exist on ${this.constructor.name} descriptor`);
        }
    }

    public addChild(descriptor: ControlDescriptor): void {
        throw new Error(`${this.constructor.name} cannot add children`);
    }

    public shutdown(): void {
        // Clean up resources if required.
    }

    public output(value: string, data?: string): void {
        // For output-based controls
    }
}

// Typescript forwards for circular references
export type ControlWindow = import('./control-window').ControlWindow;
