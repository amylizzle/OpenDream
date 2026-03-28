import { DMFPropertyBool, DMFPropertyColor, DMFPropertyNum, DMFPropertyPos, DMFPropertySize, DMFPropertyString } from '../DMF/dmf-property';
import { WindowDescriptor } from './control-descriptors';
import { MacroSetDescriptor } from './macro-descriptor';
import { MenuDescriptor } from './menu-descriptor';

export class InterfaceDescriptor {
    constructor(
        public windowDescriptors: WindowDescriptor[],
        public macroSetDescriptors: MacroSetDescriptor[],
        public menuDescriptors: MenuDescriptor[]
    ) {}
}


