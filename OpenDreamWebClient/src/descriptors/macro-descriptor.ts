import { DMFPropertyBool, DMFPropertyColor, DMFPropertyNum, DMFPropertyPos, DMFPropertySize, DMFPropertyString } from '../DMF/dmf-property';
import { ElementDescriptor } from './control-descriptors';

export class MacroSetDescriptor extends ElementDescriptor {
    public macros: MacroDescriptor[] = [];

    constructor(attributesOrId: Map<string, string> | string | undefined ) {
        super(attributesOrId);
        if (attributesOrId instanceof Map) {
            this.setAttributes(attributesOrId);
        }
    }

    public CreateChildDescriptor(attributes: Map<string, string>): MacroDescriptor | null {
        const child = new MacroDescriptor(attributes);
        // Populate attributes if needed
        this.macros.push(child);
        return child;
    }

    public CreateCopy(id: string): ElementDescriptor {
        const copy = new MacroSetDescriptor(id);
        Object.assign(copy, this);
        copy.id = new DMFPropertyString(id);
        copy.macros = this.macros.map(macro => macro.CreateCopy(macro.id.value) as MacroDescriptor);
        return copy;
    }
}

export class MacroDescriptor extends ElementDescriptor {
    public command: DMFPropertyString = new DMFPropertyString('');

    constructor(attributesOrId: Map<string, string> | string | undefined ) {
        super(attributesOrId);
        if (attributesOrId instanceof Map) {
            this.setAttributes(attributesOrId);
        }
    }    
}