import { InterfaceControl } from './interface-control';
import { ControlDescriptorTab } from '../descriptors/control-descriptors';

export class ControlTab extends InterfaceControl {
    private tabContainer: HTMLElement = null!;
    private tabHeader: HTMLElement = null!;
    private tabContent: HTMLElement = null!;
    private tabs: Map<string, { id: string; element: HTMLElement; button: HTMLElement }> = new Map();
    private currentTabId: string | null = null;

    public get descriptor(): ControlDescriptorTab {
        return this._descriptor as ControlDescriptorTab;
    }

    constructor(descriptor: ControlDescriptorTab, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        this.tabContainer = document.createElement('div');
        this.tabContainer.id = this.id;
        this.tabContainer.style.display = 'flex';
        this.tabContainer.style.flexDirection = 'column';
        this.tabContainer.style.width = '100%';
        this.tabContainer.style.height = '100%';
        this.tabContainer.style.overflow = 'hidden';

        // Create tab header with buttons
        this.tabHeader = document.createElement('div');
        this.tabHeader.id = `${this.id}-header`;
        this.tabHeader.style.display = 'flex';
        this.tabHeader.style.flexWrap = this.descriptor.multi_line.value ? 'wrap' : 'nowrap';
        this.tabHeader.style.borderBottom = '1px solid #ccc';
        this.tabHeader.style.backgroundColor = '#f5f5f5';
        this.tabHeader.style.padding = '4px';
        this.tabHeader.style.gap = '2px';
        this.tabHeader.style.overflow = 'auto';
        this.tabContainer.appendChild(this.tabHeader);

        // Create tab content area
        this.tabContent = document.createElement('div');
        this.tabContent.id = `${this.id}-content`;
        this.tabContent.style.flex = '1';
        this.tabContent.style.overflow = 'auto';
        this.tabContent.style.backgroundColor = '#fff';
        this.tabContainer.appendChild(this.tabContent);

        this.updateElementDescriptor();
        return this.tabContainer;
    }

    protected updateElementDescriptor(): void {
        super.updateElementDescriptor();

        // Clear existing tabs
        this.tabs.clear();
        this.tabHeader.innerHTML = '';
        this.tabContent.innerHTML = '';
        this.currentTabId = null;

        // Parse tab IDs from descriptor
        const tabIds = this.descriptor.tabs.value
            .split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0);

        // Load each tab
        for (const tabId of tabIds) {
            const tabWindow = this.windowControl?.windowControl?.InterfaceManager?.Windows?.get(tabId);
            if (!tabWindow) {
                console.warn(`Tab window not found: ${tabId}`);
                continue;
            }

            // Create tab button in header
            const button = document.createElement('button');
            button.textContent = tabWindow.descriptor.title.asRaw() || tabId;
            button.style.padding = '8px 16px';
            button.style.border = '1px solid #ccc';
            button.style.backgroundColor = '#e8e8e8';
            button.style.cursor = 'pointer';
            button.style.fontSize = '12px';
            button.style.fontFamily = 'Arial, sans-serif';
            button.style.borderRadius = '4px 4px 0 0';
            button.style.whiteSpace = 'nowrap';
            button.style.flex = '0 0 auto';

            button.addEventListener('click', () => {
                this.selectTab(tabId);
                if (this.descriptor.on_tab.value) {
                    this.windowControl?.windowControl?.InterfaceManager?.RunCommand(this.descriptor.on_tab.value);
                }
            });

            this.tabHeader.appendChild(button);

            // Create tab content element
            const contentDiv = document.createElement('div');
            contentDiv.id = `${this.id}-tab-${tabId}`;
            contentDiv.style.display = 'none';
            contentDiv.style.width = '100%';
            contentDiv.style.height = '100%';
            contentDiv.style.overflow = 'auto';
            
            // Add the tab window's UI element
            const tabElement = tabWindow.createUIElement();
            contentDiv.appendChild(tabElement);
            this.tabContent.appendChild(contentDiv);

            this.tabs.set(tabId, {
                id: tabId,
                element: contentDiv,
                button: button
            });
        }

        // Set the current tab
        const currentTabTitle = this.descriptor.current_tab.value;
        if (currentTabTitle) {
            // Find tab by title match
            for (const [tabId, tabData] of this.tabs.entries()) {
                if (tabData.button.textContent === currentTabTitle) {
                    this.selectTab(tabId);
                    return;
                }
            }
        }

        // If no current tab set, select the first one
        if (this.tabs.size > 0) {
            const firstTabId = this.tabs.keys().next().value;
            this.selectTab(firstTabId!);
        }
    }

    private selectTab(tabId: string): void {
        // Deselect current tab
        if (this.currentTabId && this.tabs.has(this.currentTabId)) {
            const oldTab = this.tabs.get(this.currentTabId)!;
            oldTab.element.style.display = 'none';
            oldTab.button.style.backgroundColor = '#e8e8e8';
            oldTab.button.style.borderBottom = '1px solid #ccc';
        }

        // Select new tab
        const newTab = this.tabs.get(tabId);
        if (newTab) {
            this.currentTabId = tabId;
            newTab.element.style.display = 'block';
            newTab.button.style.backgroundColor = '#fff';
            newTab.button.style.borderBottom = 'none';
            this.descriptor.current_tab.value = newTab.button.textContent || '';
        }
    }

    public tryGetProperty(property: string): unknown {
        switch (property) {
            case 'current-tab':
                return this.currentTabId || '';
            default:
                return super.tryGetProperty(property);
        }
    }

    public shutdown(): void {
        this.tabs.clear();
        super.shutdown();
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
