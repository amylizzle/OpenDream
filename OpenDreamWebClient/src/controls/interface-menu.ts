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

    constructor(descriptor: MenuDescriptor, private interfaceManager: any) {
        super(descriptor);
        this.pauseMenuCreation = true;

        for (const menuElement of descriptor.elements) {
            this.addChild(menuElement);
        }

        this.pauseMenuCreation = false;
        this.createMenu();
    }

    public setGroupChecked(group: string, id: string): void {
        for (const menuElement of this.menuElementsById.values()) {
            if ((menuElement.descriptor as any).group?.value === group) {
                (menuElement.descriptor as any).isChecked = new DMFPropertyBool(
                    menuElement.descriptor.id.value === id
                );
            }
        }
    }

    public addChild(descriptor: MenuElementDescriptor): void {
        let element: MenuElement;
        const categoryValue = descriptor.category?.value || "";

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
            const categoryValue = (menuElement.descriptor as any).category?.value || "";
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

    constructor(descriptor: MenuElementDescriptor, private parentMenu: InterfaceMenu) {
        super(descriptor);
    }

    get category(): string {
        return (this.descriptor as any).category?.value || "";
    }

    get command(): string {
        return (this.descriptor as any).command?.value || "";
    }

    get group(): string {
        return (this.descriptor as any).group?.value || "";
    }

    get canCheck(): boolean {
        return (this.descriptor as any).canCheck?.value ?? false;
    }

    get isChecked(): boolean {
        return (this.descriptor as any).isChecked?.value ?? false;
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

        if (this.canCheck) {
            if (this.isChecked) {
                text += " ☑";
            }
        }

        const menuButton: MenuButton = {
            text: text,
            onPressed: () => {
                if (this.canCheck) {
                    if (this.group) {
                        this.parentMenu.setGroupChecked(this.group, this.id);
                    } else {
                        (this.descriptor as any).isChecked = new DMFPropertyBool(!this.isChecked);
                    }
                }
                this.parentMenu["createMenu"]?.();
                if (this.command) {
                    this.parentMenu["interfaceManager"]?.RunCommand(this.command);
                }
            }
        };

        return menuButton;
    }

    public addChild(descriptor: MenuElementDescriptor): void {
        // Set the child's category to this element
        const updatedDescriptor = new MenuElementDescriptor(
            new Map(Array.from((descriptor as any).constructor.prototype || []))
        );
        (updatedDescriptor as any).category = new DMFPropertyString(this.descriptor.name.value);

        // Pass this on to the parent menu
        this.parentMenu.addChild(updatedDescriptor);
    }
}
