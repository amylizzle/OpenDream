import { DMFPropertyBool, DMFPropertyColor, DMFPropertyNum, DMFPropertyPos, DMFPropertySize, DMFPropertyString } from '../DMF/dmf-property';

export class ElementDescriptor {
    public id: DMFPropertyString;
    public name: DMFPropertyString = new DMFPropertyString('');

    constructor(attributesOrId: Map<string, string> | string | undefined ) {
        if(attributesOrId === undefined)
            this.id = new DMFPropertyString("randomstring")
        else if (typeof attributesOrId === "string")
            this.id = new DMFPropertyString(attributesOrId);
        else if (attributesOrId instanceof Map) {
            const id = attributesOrId.get("id") || "randomstring";
            this.id = new DMFPropertyString(id);
            // Populate other attributes by iterating over map and swapping from kebab case to snake case
            attributesOrId.forEach((value, key) => {
                const snakeKey = key.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
                if (snakeKey in this) {
                    //get the property type and asign the value accordingly
                    const prop = (this as any)[snakeKey];
                    if (prop instanceof DMFPropertyString) {
                        (this as any)[snakeKey] = new DMFPropertyString(value);
                    } else if (prop instanceof DMFPropertyNum) {
                        (this as any)[snakeKey] = new DMFPropertyNum(parseFloat(value));
                    } else if (prop instanceof DMFPropertyBool) {
                        (this as any)[snakeKey] = new DMFPropertyBool(value.toLowerCase() === "true");
                    } else if (prop instanceof DMFPropertyColor) {
                        (this as any)[snakeKey] = new DMFPropertyColor(value);
                    } else if (prop instanceof DMFPropertyPos) {
                        const [x, y] = value.split(',').map(Number);
                        (this as any)[snakeKey] = new DMFPropertyPos(x, y);
                    } else if (prop instanceof DMFPropertySize) {
                        const [width, height] = value.split(',').map(Number);
                        (this as any)[snakeKey] = new DMFPropertySize(width, height);
                    }
                }
            });
        } else {
            throw new Error("Invalid constructor argument for ElementDescriptor");
        }
    }

    public CreateCopy(id: string): ElementDescriptor {
        const copy = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        copy.id = new DMFPropertyString(id);
        return copy;
    }

    public CreateChildDescriptor(attributes: Map<string, string>): ElementDescriptor | null {
        throw new Error("CreateChildDescriptor not implemented for " + this.constructor.name);
    }
}

export abstract class ControlDescriptor extends ElementDescriptor {
    public pos: DMFPropertyPos = new DMFPropertyPos(0, 0);
    public size: DMFPropertySize = new DMFPropertySize(0, 0);
    public anchor1?: DMFPropertyPos;
    public anchor2?: DMFPropertyPos;
    public is_visible: DMFPropertyBool = new DMFPropertyBool(true);
    public is_transparent: DMFPropertyBool = new DMFPropertyBool(false);
    public border: DMFPropertyString = new DMFPropertyString('none');
    public flash: DMFPropertyNum = new DMFPropertyNum(0);
    public saved_params: DMFPropertyString = new DMFPropertyString("");
    public text_color: DMFPropertyColor = new DMFPropertyColor('#000000');
    public background_color: DMFPropertyColor = new DMFPropertyColor('transparent');
    public is_default: DMFPropertyBool = new DMFPropertyBool(false);
    public is_disabled: DMFPropertyBool = new DMFPropertyBool(false);
    public focus: DMFPropertyBool = new DMFPropertyBool(false);
    public drop_zone: DMFPropertyBool = new DMFPropertyBool(false);
    public right_click: DMFPropertyBool = new DMFPropertyBool(false);
    public font_family: DMFPropertyString = new DMFPropertyString('');
    public font_size: DMFPropertyNum = new DMFPropertyNum(0);
    public font_style: DMFPropertyString = new DMFPropertyString('');
    public on_size: DMFPropertyString = new DMFPropertyString('');
    public type: DMFPropertyString = new DMFPropertyString('');
}

export class WindowDescriptor extends ControlDescriptor {
    public can_minimize: DMFPropertyBool = new DMFPropertyBool(true);
    public can_resize: DMFPropertyBool = new DMFPropertyBool(true);
    public is_minimized: DMFPropertyBool = new DMFPropertyBool(false);
    public is_maximized: DMFPropertyBool = new DMFPropertyBool(false);
    public alpha: DMFPropertyNum = new DMFPropertyNum(255);
    public statusbar: DMFPropertyBool = new DMFPropertyBool(false);
    public transparent_color: DMFPropertyColor = new DMFPropertyColor('transparent');
    public can_close: DMFPropertyBool = new DMFPropertyBool(true);
    public title: DMFPropertyString = new DMFPropertyString('');
    public titlebar: DMFPropertyBool = new DMFPropertyBool(true);
    public icon: DMFPropertyString = new DMFPropertyString('');
    public image: DMFPropertyString = new DMFPropertyString('');
    public image_mode: DMFPropertyString = new DMFPropertyString('stretch');
    public keep_aspect: DMFPropertyBool = new DMFPropertyBool(false);
    public macro: DMFPropertyString = new DMFPropertyString('');
    public menu: DMFPropertyString = new DMFPropertyString('');
    public on_close: DMFPropertyString = new DMFPropertyString('');
    public can_scroll: DMFPropertyString = new DMFPropertyString('none');
    public is_pane: DMFPropertyBool = new DMFPropertyBool(false);
    public on_status: DMFPropertyString = new DMFPropertyString('');

    public ControlDescriptors: ControlDescriptor[] = [];

    public CreateChildDescriptor(attributes: Map<string, string>): ControlDescriptor | null {
        const elementType = attributes.get("type");
        if (!elementType) return null;

        if (elementType === "MAIN") {
            attributes.delete("name");
            attributes.set("name", this.name.value);

            attributes.forEach((value, key) => {
                const snakeKey = key.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
                if (snakeKey in this) {
                    //get the property type and asign the value accordingly
                    const prop = (this as any)[snakeKey];
                    if (prop instanceof DMFPropertyString) {
                        (this as any)[snakeKey] = new DMFPropertyString(value);
                    } else if (prop instanceof DMFPropertyNum) {
                        (this as any)[snakeKey] = new DMFPropertyNum(parseFloat(value));
                    } else if (prop instanceof DMFPropertyBool) {
                        (this as any)[snakeKey] = new DMFPropertyBool(value.toLowerCase() === "true");
                    } else if (prop instanceof DMFPropertyColor) {
                        (this as any)[snakeKey] = new DMFPropertyColor(value);
                    } else if (prop instanceof DMFPropertyPos) {
                        const [x, y] = value.split(',').map(Number);
                        (this as any)[snakeKey] = new DMFPropertyPos(x, y);
                    } else if (prop instanceof DMFPropertySize) {
                        const [width, height] = value.split(',').map(Number);
                        (this as any)[snakeKey] = new DMFPropertySize(width, height);
                    }
                }
            });
            return this;
        }

        let descriptorType: any = null;
        switch (elementType) {
            case "MAP":
                descriptorType = ControlDescriptorMap;
                break;
            case "CHILD":
                descriptorType = ControlDescriptorChild;
                break;
            case "OUTPUT":
                descriptorType = ControlDescriptorOutput;
                break;
            case "INFO":
                descriptorType = ControlDescriptorInfo;
                break;
            case "INPUT":
                descriptorType = ControlDescriptorInput;
                break;
            case "BUTTON":
                descriptorType = ControlDescriptorButton;
                break;
            case "BROWSER":
                descriptorType = ControlDescriptorBrowser;
                break;
            case "LABEL":
                descriptorType = ControlDescriptorLabel;
                break;
            case "GRID":
                descriptorType = ControlDescriptorGrid;
                break;
            case "TAB":
                descriptorType = ControlDescriptorTab;
                break;
            case "BAR":
                descriptorType = ControlDescriptorBar;
                break;
            default:
                return null;
        }

        if (descriptorType === ControlDescriptorChild) {
            // CHILD's top/bottom attributes alias to left/right
            if (attributes.has("top")) {
                attributes.set("left", attributes.get("top")!);
            }
            if (attributes.has("bottom")) {
                attributes.set("right", attributes.get("bottom")!);
            }
        }

        const child = new descriptorType(attributes);
        if (!child) return null;

        this.ControlDescriptors.push(child);
        return child;
    }

    public CreateCopy(id: string): ElementDescriptor {
        const copy = new WindowDescriptor(id);
        // Shallow copy properties
        Object.assign(copy, this);
        copy.id = new DMFPropertyString(id);
        // Deep copy controlDescriptors if needed
        copy.ControlDescriptors = this.ControlDescriptors.map(child => child.CreateCopy(child.id.value) as ControlDescriptor);
        return copy;
    }

    public WithVisible(visible: boolean): WindowDescriptor {
        const copy = this.CreateCopy(this.id.value) as WindowDescriptor;
        copy.is_visible = new DMFPropertyBool(visible);
        return copy;
    }
}

export class ControlDescriptorMap extends ControlDescriptor {
    public view_size: DMFPropertyNum = new DMFPropertyNum(0);
    public style: DMFPropertyString = new DMFPropertyString("");
    public text_mode: DMFPropertyBool = new DMFPropertyBool(false);
    public icon_size: DMFPropertyNum = new DMFPropertyNum(0);
    public letterbox: DMFPropertyBool = new DMFPropertyBool(true);
    public zoom: DMFPropertyNum = new DMFPropertyNum(0);
    public zoom_mode: DMFPropertyString = new DMFPropertyString("normal");
    public on_show: DMFPropertyString = new DMFPropertyString("");
    public on_hide: DMFPropertyString = new DMFPropertyString("");
}
export class ControlDescriptorChild extends ControlDescriptor {
    public lock: DMFPropertyString = new DMFPropertyString("none");
    public is_vert: DMFPropertyBool = new DMFPropertyBool(false);
    public splitter: DMFPropertyNum = new DMFPropertyNum(50);
    public show_splitter: DMFPropertyBool = new DMFPropertyBool(true);
    public left: DMFPropertyString = new DMFPropertyString("");
    public right: DMFPropertyString = new DMFPropertyString("");
}
export class ControlDescriptorOutput extends ControlDescriptor {
    public legacy_size: DMFPropertyBool = new DMFPropertyBool(false);
    public style: DMFPropertyString = new DMFPropertyString("");
    public max_lines: DMFPropertyNum = new DMFPropertyNum(1000);
    public link_color: DMFPropertyColor = new DMFPropertyColor('blue');
    public visited_color: DMFPropertyColor = new DMFPropertyColor('purple');
    public image: DMFPropertyString = new DMFPropertyString("");
    public enable_http_images: DMFPropertyBool = new DMFPropertyBool(false);
}
export class ControlDescriptorInfo extends ControlDescriptor {
    public multi_line: DMFPropertyBool = new DMFPropertyBool(true);
    public highlight_color: DMFPropertyColor = new DMFPropertyColor('green');
    public tab_text_color: DMFPropertyColor = new DMFPropertyColor('transparent');
    public tab_background_color: DMFPropertyColor = new DMFPropertyColor('transparent');
    public prefix_color: DMFPropertyColor = new DMFPropertyColor('transparent');
    public suffix_color: DMFPropertyColor = new DMFPropertyColor('transparent');
    public allow_html: DMFPropertyBool = new DMFPropertyBool(true);
    public tab_font_family: DMFPropertyString = new DMFPropertyString("");
    public tab_font_size: DMFPropertyNum = new DMFPropertyNum(0);
    public tab_font_style: DMFPropertyString = new DMFPropertyString("");
    public on_show: DMFPropertyString = new DMFPropertyString("");
    public on_hide: DMFPropertyString = new DMFPropertyString("");
}
export class ControlDescriptorInput extends ControlDescriptor {
    public multi_line: DMFPropertyBool = new DMFPropertyBool(false);
    public is_password: DMFPropertyBool = new DMFPropertyBool(false);
    public no_command: DMFPropertyBool = new DMFPropertyBool(false);
    public text: DMFPropertyString = new DMFPropertyString("");
    public command: DMFPropertyString = new DMFPropertyString("");
}
export class ControlDescriptorButton extends ControlDescriptor {
    public is_flat: DMFPropertyBool = new DMFPropertyBool(false);
    public is_checked: DMFPropertyBool = new DMFPropertyBool(false);
    public group: DMFPropertyString = new DMFPropertyString("");
    public button_type: DMFPropertyString = new DMFPropertyString("pushbutton");
    public text: DMFPropertyString = new DMFPropertyString("");
    public image: DMFPropertyString = new DMFPropertyString("");
    public command: DMFPropertyString = new DMFPropertyString("");
}
export class ControlDescriptorBrowser extends ControlDescriptor {
    public show_history: DMFPropertyBool = new DMFPropertyBool(false);
    public show_url: DMFPropertyBool = new DMFPropertyBool(false);
    public use_title: DMFPropertyBool = new DMFPropertyBool(false);
    public auto_format: DMFPropertyBool = new DMFPropertyBool(true);
    public on_show: DMFPropertyString = new DMFPropertyString("");
    public on_hide: DMFPropertyString = new DMFPropertyString("");
}
export class ControlDescriptorLabel extends ControlDescriptor {
    public text: DMFPropertyString = new DMFPropertyString("");
    public align: DMFPropertyString = new DMFPropertyString("center");
    public text_wrap: DMFPropertyBool = new DMFPropertyBool(false);
    public image: DMFPropertyString = new DMFPropertyString("");
    public image_mode: DMFPropertyString = new DMFPropertyString("stretch");
    public keep_aspect: DMFPropertyBool = new DMFPropertyBool(false);
}
export class ControlDescriptorGrid extends ControlDescriptor {
    public cells: DMFPropertySize = new DMFPropertySize(0,0);
    public cell_span: DMFPropertySize = new DMFPropertySize(1,1);
    public is_list: DMFPropertyBool = new DMFPropertyBool(false);
    public show_lines: DMFPropertyString = new DMFPropertyString("both");
    public style: DMFPropertyString = new DMFPropertyString("");
    public highlight_color: DMFPropertyColor = new DMFPropertyColor('green');
    public line_color: DMFPropertyColor = new DMFPropertyColor('#c0c0c0');
    public link_color: DMFPropertyColor = new DMFPropertyColor('blue');
    public visited_color: DMFPropertyColor = new DMFPropertyColor('purple');
    public current_cell: DMFPropertySize = new DMFPropertySize(0,0);
    public show_names: DMFPropertyBool = new DMFPropertyBool(true);
    public small_icons: DMFPropertyBool = new DMFPropertyBool(false);
    public enable_http_images: DMFPropertyBool = new DMFPropertyBool(false);
}
export class ControlDescriptorTab extends ControlDescriptor {
    public multi_line: DMFPropertyBool = new DMFPropertyBool(true);
    public current_tab: DMFPropertyString = new DMFPropertyString("");
    public on_tab: DMFPropertyString = new DMFPropertyString("");
    public tabs: DMFPropertyString = new DMFPropertyString("");
}
export class ControlDescriptorBar extends ControlDescriptor {
    public width: DMFPropertyNum = new DMFPropertyNum(10);
    public dir: DMFPropertyString = new DMFPropertyString("east");
    public angle1: DMFPropertyNum = new DMFPropertyNum(0);
    public angle2: DMFPropertyNum = new DMFPropertyNum(180);
    public bar_color: DMFPropertyColor = new DMFPropertyColor('transparent');
    public is_slider: DMFPropertyBool = new DMFPropertyBool(false);
    public value: DMFPropertyNum = new DMFPropertyNum(0);
    public on_change: DMFPropertyString = new DMFPropertyString("");
}
