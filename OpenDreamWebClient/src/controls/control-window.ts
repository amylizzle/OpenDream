import { InterfaceControl } from './interface-control';
import {
    ControlDescriptor,
    WindowDescriptor,
    ControlDescriptorBar,
    ControlDescriptorBrowser,
    ControlDescriptorButton,
    ControlDescriptorChild,
    ControlDescriptorGrid,
    ControlDescriptorInfo,
    ControlDescriptorInput,
    ControlDescriptorLabel,
    ControlDescriptorMap,
    ControlDescriptorOutput,
    ControlDescriptorTab
} from '../descriptors/control-descriptors';
import { ControlBar } from './control-bar';
import { ControlButton } from './control-button';
import { ControlInfo } from './control-info';
import { ControlInput } from './control-input';
import { ControlLabel } from './control-label';
import { ControlMap } from './control-map';
import { ControlOutput } from './control-output';
import { ControlTab } from './control-tab';
import { ControlBrowser } from './control-browser'; 
import { ControlGrid } from './control-grid';
import { ControlChild } from './control-child';

import { DMFPropertySize } from '../DMF/dmf-property';
import type { DreamWebInterfaceManager } from '../dream-interface-manager';

export class ControlWindow extends InterfaceControl {
    public childControls: InterfaceControl[] = [];
    private menuContainer?: HTMLElement;
    private resizeObserver?: ResizeObserver;
    private currentStatus = '';
    private popupWindow?: Window;
    private paneElement?: HTMLElement;
    private isUIElementCreated = false;

    // Reference to interface manager for commands
    private interfaceManager: DreamWebInterfaceManager;
    public get InterfaceManager():DreamWebInterfaceManager { return this.interfaceManager; } // Expose as public property for child controls to access if needed

    public get descriptor(): WindowDescriptor {
        return this._descriptor as WindowDescriptor;
    }

    constructor(descriptor: WindowDescriptor, interfaceManager: DreamWebInterfaceManager){
        super(descriptor);
        this.interfaceManager = interfaceManager;
        this.updateElementDescriptor();
    }

    public createUIElement(): HTMLElement {
        if (this.isUIElementCreated) {
            const existing = document.getElementById(this.id);
            if (existing) return existing;
        }

        const container = document.createElement('div');
        container.id = this.id;
        container.style.position = 'static';
        container.style.overflow = 'clip';
        container.style.height = '100%';
        container.style.width = '100%';

        // Menu container
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = `${this.id}-menu`;
        this.menuContainer.style.position = 'static';
        this.menuContainer.style.padding = '0';
        this.menuContainer.style.backgroundColor = '#fff';
        this.menuContainer.style.borderBottom = '1px solid #ccc';
        this.menuContainer.style.minHeight = '0';
        container.appendChild(this.menuContainer);

        // Canvas - layout container for child controls
        this.paneElement = document.createElement('div');
        this.paneElement.id = `${this.id}-pane`;
        this.paneElement.style.position = 'static';

        const bgColor = this.descriptor.background_color?.value || '#f0f0f0';
        this.paneElement.style.backgroundColor = bgColor;
        container.appendChild(this.paneElement);

        this.isUIElementCreated = true;
        this.updateElementDescriptor();
        this.createChildControls();
        return container;
    }

    protected updateElementDescriptor(): void {
        // Update menu container
        if (this.menuContainer) {
            this.menuContainer.innerHTML = '';
            const menu = this.interfaceManager.Menus.get(this.descriptor.menu.asRaw());
            if (menu?.menus) {
                // Rebuild menu from menu structure
                this.buildMenuBar(this.menuContainer, menu.menus);
                this.menuContainer.style.display = 'flex';
            } else {
                this.menuContainer.style.display = 'none';
            }
        }

        // Determine window dimensions
        let width = this.descriptor.size.x == 0 ? '100%' : `${this.descriptor.size.x}px`;
        let height = this.descriptor.size.y == 0 ? '100%' : `${this.descriptor.size.y}px`;

        if (this.paneElement) {
            this.paneElement.style.width = width;
            this.paneElement.style.height = height;
        }
        // Update window attributes if not in pane mode
        if (!this.descriptor.is_pane.value && this.isUIElementCreated) {
            //this.updateWindowAttributes();
        }

        // Set active macro if default
        if (this.descriptor.is_default?.value) {
            const macroSet = this.interfaceManager?.MacroSets?.get(
                this.descriptor.macro?.value
            );
            macroSet?.setActive();
        }
        this.applyDMFLayout(this.paneElement!, this);
    }

    private buildMenuBar(container: HTMLElement, menus: any[]): void {
        for (const menu of menus) {
            const menuButton = document.createElement('button');
            menuButton.textContent = menu.text;
            menuButton.style.padding = '4px 12px';
            menuButton.style.border = '1px solid #ccc';
            menuButton.style.backgroundColor = '#f0f0f0';
            menuButton.style.cursor = 'pointer';
            menuButton.style.fontSize = '12px';

            menuButton.addEventListener('click', () => {
                this.showDropdown(menuButton, menu.entries);
            });

            container.appendChild(menuButton);
        }
    }

    private showDropdown(button: HTMLElement, entries: any[]): void {
        const dropdown = document.createElement('div');
        dropdown.style.position = 'static';
        dropdown.style.backgroundColor = 'white';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.zIndex = '10000';
        dropdown.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

        for (const entry of entries) {
            if (!entry.text) {
                // Separator
                const separator = document.createElement('div');
                separator.style.borderTop = '1px solid #ccc';
                separator.style.margin = '4px 0';
                dropdown.appendChild(separator);
            } else if (entry.onPressed) {
                // Button entry
                const item = document.createElement('button');
                item.textContent = entry.text;
                item.style.display = 'block';
                item.style.width = '100%';
                item.style.padding = '8px 12px';
                item.style.border = 'none';
                item.style.backgroundColor = 'transparent';
                item.style.textAlign = 'left';
                item.style.cursor = 'pointer';
                item.style.fontSize = '12px';

                item.addEventListener('click', () => {
                    entry.onPressed();
                    dropdown.remove();
                });

                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#e0e0e0';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'transparent';
                });

                dropdown.appendChild(item);
            } else if (entry.entries) {
                // Submenu - not fully implemented for simplicity
                const subItem = document.createElement('div');
                subItem.textContent = entry.text + ' ▶';
                subItem.style.padding = '8px 12px';
                subItem.style.fontSize = '12px';
                dropdown.appendChild(subItem);
            }
        }

        document.body.appendChild(dropdown);

        const rect = button.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.left = `${rect.left}px`;

        const closeDropdown = (e: Event) => {
            if (e.target !== button) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        };
        document.addEventListener('click', closeDropdown);
    }

    /// Closes the window if it is a child window. No effect if it is either a default window or a pane
    public closeChildWindow(): void {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.close();
        }
    }

    public createWindow(): Window | null {
        if(this.descriptor.is_visible.value === false) {
            return null;
        }
        if (this.popupWindow && !this.popupWindow.closed) {
            return this.popupWindow;
        }

        // Determine window dimensions
        let width = this.descriptor.size.x || Math.floor(window.innerWidth * 0.8);
        let height = this.descriptor.size.y || Math.floor(window.innerHeight * 0.8);

        // Open popup window
        const popupWindow = window.open(
            '',
            this.id,
            `width=${width},height=${height}`
        );

        if (!popupWindow) {
            console.warn(`Failed to open popup window: ${this.id}`);
            return null;
        }

        // Initialize popup window
        popupWindow.document.title = this.descriptor.title.asRaw();

        // Add event listener for close
        const onBeforeUnload = () => {
            if (this.descriptor.on_close?.value) {
                this.interfaceManager?.RunCommand(
                    this.descriptor.on_close.value
                );
            }
            this.popupWindow = undefined;
        };
        popupWindow.addEventListener('beforeunload', onBeforeUnload);

        this.popupWindow = popupWindow;
        return popupWindow;
    }

    public createChildControls(): void {
        const controlDescriptors = this.descriptor.ControlDescriptors || [];
        for (const descriptor of controlDescriptors) {
            this.addChild(descriptor);
        }
    }

    public addChild(descriptor: ControlDescriptor): void {
        // Validate descriptor type
        if (descriptor instanceof WindowDescriptor) {
            throw new Error('Cannot add a window to a window');
        }

        // Create control based on descriptor type
        let control: InterfaceControl;
        switch (descriptor.constructor) {
            // Add cases for different control types here, e.g.:
            case ControlDescriptorChild:
                control = new ControlChild(descriptor as ControlDescriptorChild, this);
                break;
            case ControlDescriptorInput:
                control = new ControlInput(descriptor as ControlDescriptorInput, this);
                break;
            case ControlDescriptorButton:
                control = new ControlButton(descriptor as ControlDescriptorButton, this);
                break;
            case ControlDescriptorOutput:
                control = new ControlOutput(descriptor as ControlDescriptorOutput, this);
                break;
            case ControlDescriptorInfo:
                control = new ControlInfo(descriptor as ControlDescriptorInfo, this);
                break;
            case ControlDescriptorMap:
                control = new ControlMap(descriptor as ControlDescriptorMap, this);
                break;   
            case ControlDescriptorBrowser:
                control = new ControlBrowser(descriptor as ControlDescriptorBrowser, this); 
                break;             
            case ControlDescriptorLabel:
                control = new ControlLabel(descriptor as ControlDescriptorLabel, this);
                break;
            case ControlDescriptorGrid:
                control = new ControlGrid(descriptor as ControlDescriptorGrid, this);
                break;
            case ControlDescriptorTab:  
                control = new ControlTab(descriptor as ControlDescriptorTab, this);
                break;
            case ControlDescriptorBar:
                control = new ControlBar(descriptor as ControlDescriptorBar, this);
                break;
            default:
                console.warn(`Unknown control type: ${descriptor.type}. Skipping.`);
                return;
        }
        
        // Handle out-of-order components - auto-sort by position
        const curPos = descriptor.pos || { x: 0, y: 0 };
        const curX = (curPos )?.x ?? 0;
        const curY = (curPos )?.y ?? 0;

        if (this.childControls.length > 0) {
            const lastControl = this.childControls[this.childControls.length - 1];
            const lastPos = lastControl.descriptor?.pos || { x: 0, y: 0 };
            const prevX = (lastPos )?.x ?? 0;
            const prevY = (lastPos )?.y ?? 0;

            if (prevX > curX || prevY > curY) {
                console.warn(
                    `Out of order component ${descriptor.id.value}. ` +
                    `Elements should be defined in order. Attempting to fix.`
                );

                let insertIndex = 0;
                for (let i = 0; i < this.childControls.length; i++) {
                    const childPos = this.childControls[i].descriptor?.pos || {
                        x: 0,
                        y: 0
                    };
                    const checkX = (childPos )?.x ?? 0;
                    const checkY = (childPos )?.y ?? 0;

                    if (checkX <= curX && checkY <= curY) {
                        insertIndex = i + 1;
                    } else {
                        break;
                    }
                }

                this.childControls.splice(insertIndex, 0, control);
            } else {
                this.childControls.push(control);
            }
        } else {
            this.childControls.push(control);
        }

        // Add to canvas
        if (this.paneElement) {
            const element = control.createUIElement();
            this.paneElement.appendChild(element);        
        }
    }

    public tryGetProperty(property: string): unknown {
        switch (property) {
            case 'size':
                if (this.popupWindow) {
                    return new DMFPropertySize(
                        this.popupWindow.innerWidth,
                        this.popupWindow.innerHeight
                    );
                } else {
                    return this.descriptor.size || new DMFPropertySize(0, 0);
                }

            case 'inner-size':
                return new DMFPropertySize(
                    this.paneElement?.clientWidth ?? 0,
                    this.paneElement?.clientHeight ?? 0
                );

            case 'outer-size':
                if (this.popupWindow) {
                    return new DMFPropertySize(
                        this.popupWindow.outerWidth,
                        this.popupWindow.outerHeight
                    );
                }
                return this.tryGetProperty('size');

            case 'is-minimized':
                // Browsers don't expose minimization state for popups
                return false;

            case 'is-maximized':
                // Approximate: check if window size is close to screen size
                if (this.popupWindow) {
                    return (
                        this.popupWindow.innerWidth >= screen.width * 0.95 &&
                        this.popupWindow.innerHeight >= screen.height * 0.95
                    );
                }
                return false;

            default:
                return super.tryGetProperty(property);
        }
    }

    public setProperty(property: string, value: string): void {
        switch (property) {
            case 'size':
                if (this.popupWindow) {
                    // Parse size string (e.g., "800,600")
                    const parts = value.split(',');
                    const width = parseInt(parts[0], 10);
                    const height = parseInt(parts[1], 10);
                    if (!isNaN(width) && !isNaN(height)) {
                        this.popupWindow.resizeTo(width, height);
                    }
                }
                return;

            case 'pos':
                if (this.popupWindow) {
                    // Parse position string (e.g., "100,200")
                    const parts = value.split(',');
                    const x = parseInt(parts[0], 10);
                    const y = parseInt(parts[1], 10);
                    if (!isNaN(x) && !isNaN(y)) {
                        this.popupWindow.moveTo(x, y);
                    }
                }
                return;
        }

        super.setProperty(property, value);
    }

    public setStatus(status: string): void {
        if (this.currentStatus === status) {
            return;
        }

        this.currentStatus = status;

        const onStatusCommand = this.descriptor.on_status?.value;
        if (!onStatusCommand) {
            return;
        }

        const command = onStatusCommand.replace('[[*]]', status);
        this.interfaceManager?.RunCommand(command);
    }

    public shutdown(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.closeChildWindow();
        super.shutdown();
    }
}