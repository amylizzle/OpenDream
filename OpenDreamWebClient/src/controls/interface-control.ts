import { InterfaceElement } from './interface-element';
import { ControlDescriptor } from '../descriptors/control-descriptors';
import { DMFPropertyString, DMFPropertyNum, DMFPropertyBool, DMFPropertyColor, DMFPropertyPos, DMFPropertySize } from '../DMF/dmf-property';


export abstract class InterfaceControl extends InterfaceElement {
    public get descriptor(): ControlDescriptor {
        return this._descriptor as ControlDescriptor;
    }

    public windowControl?: ControlWindow;

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor);
        this.windowControl = windowControl;
    }

    public abstract createUIElement(): HTMLElement;

    // make sure to call applyDMFLayout after updating the descriptor to update the position/size of the element
    protected abstract updateElementDescriptor(): void 

    

    protected applyDMFLayout(element: HTMLElement, control: InterfaceControl): void {
        if (!element || !control) {
            console.warn(`applyDMFLayout called with invalid element ${element} or control ${control.descriptor.id}`);
            return;
        }
        element.style.position = 'static';
        //okay, to start with set the element to pos
        element.style.top = `${control.descriptor.pos.y}px`;
        element.style.left = `${control.descriptor.pos.x}px`;
        console.log(`Positioning control ${control.id} at (${control.descriptor.pos.x}, ${control.descriptor.pos.y})`);
        //next, if size is specified, set it by setting the bottom right to pos + size 
        if (control.descriptor.size.x !== 0) {
            element.style.right = `${control.descriptor.pos.x + control.descriptor.size.x}px`;
            console.log(`Setting control ${control.id} right to ${control.descriptor.pos.x + control.descriptor.size.x}px`);
        } else {
            //if is zero, so take up the remaining space (using a calc expression)
            element.style.right = `calc(100% - ${control.descriptor.pos.x}px)`;
            console.log(`Setting control ${control.id} right to calc(100% - ${control.descriptor.pos.x}px)`);
        }
        if (control.descriptor.size.y !== 0) {
            element.style.bottom = `${control.descriptor.pos.y + control.descriptor.size.y}px`;
            console.log(`Setting control ${control.id} bottom to ${control.descriptor.pos.y + control.descriptor.size.y}px`);
        } else {
            //if is zero, so take up the remaining space (using a calc expression)
            element.style.bottom = `calc(100% - ${control.descriptor.pos.y}px)`;
            console.log(`Setting control ${control.id} bottom to calc(100% - ${control.descriptor.pos.y}px)`);
        }

        //now, anchor values override all of that
        //if anchor1 is specified, then topleft is a percentage of the parent, which we can set with calc again
        if (!isNaN(control.descriptor.anchor1.x) && !isNaN(control.descriptor.anchor1.y)) {
            const anchor1 = control.descriptor.anchor1.vector;
            element.style.left = `calc(${anchor1.x}%)`;
            element.style.top = `calc(${anchor1.y}%)`;
            console.log(`Setting control ${control.id} anchor1 to (${anchor1.x}%, ${anchor1.y}%)`);
        }
        //if anchor2 is specified, then bottomright is a percentage of the parent, which we can set with calc again
        // UNLESS an element of anchor2 has the same value as anchor1, in which case it stays as the size provided by the descriptor
        if (!isNaN(control.descriptor.anchor2.x) && !isNaN(control.descriptor.anchor2.y)) {
            const anchor2 = control.descriptor.anchor2.vector;
            console.log(`Setting control ${control.id} anchor2 to (${anchor2.x}%, ${anchor2.y}%)`);
            if (anchor2.x === control.descriptor.anchor1.x) {
                element.style.width = `${control.descriptor.size.x}px`;
                console.log(`Setting control ${control.id} width to ${control.descriptor.size.x}px due to anchor2.x matching anchor1.x`);
            } else {
                element.style.right = `calc(${100 - anchor2.x}%)`;
            }
            if (anchor2.y === control.descriptor.anchor1.y) {
                element.style.height = `${control.descriptor.size.y}px`;
                console.log(`Setting control ${control.id} height to ${control.descriptor.size.y}px due to anchor2.y matching anchor1.y`);
            } else {
                element.style.bottom = `calc(${100 - anchor2.y}%)`;
            }
            
        }
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
