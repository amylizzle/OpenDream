
import { DMFPropertyBool, DMFPropertyColor, DMFPropertyNum, DMFPropertyPos, DMFPropertySize, DMFPropertyString } from '../DMF/dmf-property';
import { ElementDescriptor } from './control-descriptors';

export class MenuDescriptor extends ElementDescriptor {
    public elements: MenuElementDescriptor[] = [];

    constructor(attributesOrId: Map<string, string> | string | undefined ) {
        super(attributesOrId);
        if (attributesOrId instanceof Map) {
            this.setAttributes(attributesOrId);
        }
    }

    public CreateCopy(id: string): ElementDescriptor {
        const copy = new MenuDescriptor(id);
        Object.assign(copy, this);
        copy.id = new DMFPropertyString(id);
        copy.elements = this.elements.map(element => element.CreateCopy(element.id.value) as MenuElementDescriptor);
        return copy;
    }

    public CreateChildDescriptor(attributes: Map<string, string>): MenuElementDescriptor | null {
        const child = new MenuElementDescriptor(attributes);
        // Populate attributes if needed
        this.elements.push(child);
        return child;
    }
}

export class MenuElementDescriptor extends ElementDescriptor {
    public command: DMFPropertyString = new DMFPropertyString('');
    public category: DMFPropertyString = new DMFPropertyString('');
    public can_check:DMFPropertyBool = new DMFPropertyBool(false);
    public is_checked: DMFPropertyBool = new DMFPropertyBool(false);
    public group: DMFPropertyString = new DMFPropertyString('');
    public index: DMFPropertyNum = new DMFPropertyNum(0);

    constructor(attributesOrId: Map<string, string> | string | undefined ) {
        super(attributesOrId);
        if (attributesOrId instanceof Map) {
            this.setAttributes(attributesOrId);
        }
    }    
}