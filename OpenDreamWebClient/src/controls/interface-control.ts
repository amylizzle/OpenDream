import { InterfaceElement } from './interface-element';
import { ControlDescriptor } from '../descriptors/control-descriptors';


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
        // Basic stub. Derived controls can override for specific behaviors.
        return (this.descriptor as any)[property];
    }

    public setProperty(property: string, value: string, manualWinset = false): void {
        // Basic stub to assign string values to descriptor.
        (this.descriptor as any)[property] = value;
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
