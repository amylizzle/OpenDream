import { InterfaceControl } from './interface-control';
import { ControlDescriptorMap } from '../descriptors/control-descriptors';
import { CreateRenderer } from '../renderer/map-main';

export class ControlMap extends InterfaceControl {
    private mapElement: HTMLElement | undefined;
    public get descriptor(): ControlDescriptorMap {
        return this._descriptor as ControlDescriptorMap;
    }

    constructor(descriptor: ControlDescriptorMap, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
        if (windowControl && this.descriptor.is_default.value) {
            if(windowControl.defaultMap) {
                console.warn(`Window ${windowControl.id} already has a default map control (${windowControl.defaultMap.id}). Overriding with ${this.id}.`);
            }
            windowControl.defaultMap = this;
        }
    }

    protected UpdateElementDescriptor(): void {
        this.ApplyDMFLayout(this.mapElement!, this);
    }    

    public CreateUIElement(): HTMLElement {
        this.mapElement = document.createElement('div');
        this.mapElement.classList.add('MAP');
        this.mapElement.id = this.id;
        //todo - why is resizing not working?
        this.UpdateElementDescriptor();
        this.mapElement.innerHTML=''
        CreateRenderer(this.mapElement).then((canvas) => this.mapElement?.appendChild(canvas))
        return this.mapElement;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
