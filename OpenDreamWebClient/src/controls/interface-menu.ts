import { InterfaceElement } from "./interface-element";
import { MenuElementDescriptor, MenuDescriptor } from "../descriptors/menu-descriptor";
import { DMFPropertyBool, DMFPropertyString } from "../DMF/dmf-property";

export interface MenuEntry {
    text: string;
}

export interface MenuButton extends MenuEntry {
    onPressed(): void;
}

export interface MenuSeparator extends MenuEntry {
}

export interface SubMenu extends MenuEntry {
    entries: MenuEntry[];
}

export class InterfaceMenu extends InterfaceElement {
    public menuElementsById: Map<string, MenuElement> = new Map();
    public menuElementsByName: Map<string, MenuElement> = new Map();
    public menus: SubMenu[] = [];

    private pauseMenuCreation: boolean;

    public get descriptor(): MenuDescriptor {
        return this._descriptor as MenuDescriptor;
    }

    constructor(descriptor: MenuDescriptor, private interfaceManager: any) {
        super(descriptor);
        this.pauseMenuCreation = true;

        for (const menuElement of descriptor.elements) {
            this.AddChild(menuElement);
        }

        this.pauseMenuCreation = false;
        this.createMenu();
    }

    public setGroupChecked(group: string, id: string): void {
        for (const menuElement of this.menuElementsById.values()) {
            if (menuElement.descriptor.group.asRaw() === group) {
                menuElement.descriptor.is_checked = new DMFPropertyBool(
                    menuElement.descriptor.id.asRaw() === id
                );
            }
        }
    }

    public AddChild(descriptor: MenuElementDescriptor): void {
        let element: MenuElement;
        const categoryValue = descriptor.category.asRaw();
        if (!categoryValue) {
            element = new MenuElement(descriptor, this);
        } else {
            let parentMenu = this.menuElementsById.get(categoryValue) ||
                            this.menuElementsByName.get(categoryValue);

            if (!parentMenu) {
                // If category is set but the parent element doesn't exist, create it
                const parentMenuDescriptor = new MenuElementDescriptor(new Map([
                    ["id", categoryValue],
                    ["name", categoryValue]
                ]));

                parentMenu = new MenuElement(parentMenuDescriptor, this);
                this.menuElementsById.set(parentMenu.id, parentMenu);
            }

            // Now add this as a child
            element = new MenuElement(descriptor, this);
            parentMenu.children.push(element);
        }

        this.menuElementsById.set(element.id, element);
        this.menuElementsByName.set(descriptor.name.value, element);
        this.createMenu(); // Update the menu to include the new child
    }

    private createMenu(): void {
        if (this.pauseMenuCreation) {
            return;
        }

        this.menus = [];

        for (const menuElement of this.menuElementsById.values()) {
            const categoryValue = menuElement.descriptor.category?.asRaw() || "";
            if (categoryValue) {
                // We only want the root-level menus here
                continue;
            }

            const menu: SubMenu = {
                text: menuElement.descriptor.name.value.replace("&", ""),
                entries: []
            };

            // TODO: Character after '&' becomes a selection shortcut

            for (const child of menuElement.children) {
                menu.entries.push(child.createMenuEntry());
            }

            this.menus.push(menu);
        }
    }
}

export class MenuElement extends InterfaceElement {
    public children: MenuElement[] = [];

    public get descriptor(): MenuElementDescriptor {
        return this._descriptor as MenuElementDescriptor;
    }

    constructor(descriptor: MenuElementDescriptor, private parentMenu: InterfaceMenu) {
        super(descriptor);
    }

    public createMenuEntry(): MenuEntry {
        let text = this.descriptor.name.value;
        text = text.replace("&", ""); // TODO: Character after '&' becomes a selection shortcut

        if (this.children.length > 0) {
            const subMenu: SubMenu = {
                text: text,
                entries: []
            };

            for (const child of this.children) {
                subMenu.entries.push(child.createMenuEntry());
            }

            return subMenu;
        }

        if (!text) {
            return { text: "" } as MenuSeparator;
        }

        if (this.descriptor.can_check.value) {
            if (this.descriptor.is_checked.value) {
                text += " ☑";
            }
        }

        const menuButton: MenuButton = {
            text: text,
            onPressed: () => {
                if (this.descriptor.can_check.value) {
                    if (this.descriptor.group.asRaw()) {
                        this.parentMenu.setGroupChecked(this.descriptor.group.asRaw(), this.id);
                    } else {
                        this.descriptor.is_checked = new DMFPropertyBool(!this.descriptor.is_checked.value);
                    }
                }
                this.parentMenu["createMenu"]?.();
                if (this.descriptor.command.asRaw()) {
                    this.parentMenu["interfaceManager"]?.RunCommand(this.descriptor.command.asRaw());
                }
            }
        };

        return menuButton;
    }

    public AddChild(descriptor: MenuElementDescriptor): void {
        // Set the child's category to this element
        const updatedDescriptor = descriptor.CreateCopy(descriptor.id.asRaw()) as MenuElementDescriptor;
        updatedDescriptor.category = new DMFPropertyString(this.descriptor.id.asRaw());
        // Pass this on to the parent menu
        this.parentMenu.AddChild(updatedDescriptor);
    }
}
