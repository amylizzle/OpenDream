import { InterfaceControl } from './interface-control';
import { ControlDescriptorMap } from '../descriptors/control-descriptors';

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

    protected updateElementDescriptor(): void {
        this.applyDMFLayout(this.mapElement!, this);
    }    

    public createUIElement(): HTMLElement {
        this.mapElement = document.createElement('div');
        this.mapElement.classList.add('MAP');
        this.mapElement.id = this.id;
        
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.src = 'src/assets/map_placeholder.png';
        img.alt = 'Map';
        img.style.objectFit = 'cover';
        this.mapElement.appendChild(img);
        return this.mapElement;
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
