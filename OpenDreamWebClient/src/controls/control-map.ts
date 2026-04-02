import { InterfaceControl } from './interface-control';
import { ControlDescriptorMap } from '../descriptors/control-descriptors';

export class ControlMap extends InterfaceControl {
    private mapElement: HTMLElement | undefined;
    public get descriptor(): ControlDescriptorMap {
        return this._descriptor as ControlDescriptorMap;
    }

    constructor(descriptor: ControlDescriptorMap, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        this.mapElement = document.createElement('div');
        this.mapElement.classList.add('control-map');
        this.mapElement.id = this.id;
        
        // Respect sizing constraints: if size is 0, fill available space; otherwise use specified size
        const width = this.descriptor.size.x || 0;
        const height = this.descriptor.size.y || 0;
        
        this.mapElement.style.width = width > 0 ? `${width}px` : '100%';
        this.mapElement.style.height = height > 0 ? `${height}px` : '100%';
        this.mapElement.style.position = 'relative';
        this.mapElement.style.overflow = 'scroll';

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
