import { InterfaceElement } from './interface-element';
import { ControlDescriptor } from '../descriptors/control-descriptors';


export abstract class InterfaceControl extends InterfaceElement {
    public get descriptor(): ControlDescriptor {
        return this._descriptor as ControlDescriptor;
    }

    public windowControl?: ControlWindow;

    constructor(descriptor: ControlDescriptor, windowControl?: ControlWindow) {
        super(descriptor);
        this.windowControl = windowControl;
    }

    public abstract CreateUIElement(): HTMLElement;



    protected ApplyDMFLayout(element: HTMLElement, control: InterfaceControl): void {
        if (!element || !control) {
            console.warn(`ApplyDMFLayout called with invalid element ${element} or control ${control.descriptor.id}`);
            return;
        }
        element.style.position = 'static';
        //okay, to start with set the element to pos
        element.style.top = `${control.descriptor.pos.y}px`;
        element.style.left = `${control.descriptor.pos.x}px`;
        //next, if size is specified, set it by setting the bottom right to pos + size 
        if (control.descriptor.size.x !== 0) {
            element.style.right = `${control.descriptor.pos.x + control.descriptor.size.x}px`;
        } else {
            //if is zero, so take up the remaining space (using a calc expression)
            element.style.right = `calc(100% - ${control.descriptor.pos.x}px)`;
        }
        if (control.descriptor.size.y !== 0) {
            element.style.bottom = `${control.descriptor.pos.y + control.descriptor.size.y}px`;
        } else {
            //if is zero, so take up the remaining space (using a calc expression)
            element.style.bottom = `calc(100% - ${control.descriptor.pos.y}px)`;
        }

        //now, anchor values override all of that
        //if anchor1 is specified, then topleft is a percentage of the parent, which we can set with calc again
        if (!isNaN(control.descriptor.anchor1.x) && !isNaN(control.descriptor.anchor1.y)) {
            const anchor1 = control.descriptor.anchor1.vector;
            element.style.left = `calc(${anchor1.x}%)`;
            element.style.top = `calc(${anchor1.y}%)`;
        }
        //if anchor2 is specified, then bottomright is a percentage of the parent, which we can set with calc again
        // UNLESS an element of anchor2 has the same value as anchor1, in which case it stays as the size provided by the descriptor
        if (!isNaN(control.descriptor.anchor2.x) && !isNaN(control.descriptor.anchor2.y)) {
            const anchor2 = control.descriptor.anchor2.vector;
            if (anchor2.x === control.descriptor.anchor1.x) {
                element.style.width = `${control.descriptor.size.x}px`;
            } else {
                element.style.right = `calc(${100 - anchor2.x}%)`;
            }
            if (anchor2.y === control.descriptor.anchor1.y) {
                element.style.height = `${control.descriptor.size.y}px`;
            } else {
                element.style.bottom = `calc(${100 - anchor2.y}%)`;
            }
            
        }
    }


}

// Typescript forwards for circular references
export type ControlWindow = import('./control-window').ControlWindow;
