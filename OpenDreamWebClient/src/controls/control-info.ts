import { InterfaceControl } from './interface-control';
import { ControlDescriptorInfo } from '../descriptors/control-descriptors';

interface StatEntry {
    name: string;
    value: string;
    atomRef?: string;
}

interface InfoPanel {
    name: string;
    element: HTMLElement;
    type: 'stat' | 'verb';
}

interface StatPanel extends InfoPanel {
    type: 'stat';
    entries: StatEntry[];
}

interface VerbPanel extends InfoPanel {
    type: 'verb';
    verbs: Array<{ name: string; ref?: string }>;
}

export class ControlInfo extends InterfaceControl {
    private container: HTMLElement = null!;
    private tabHeader: HTMLElement = null!;
    private tabContent: HTMLElement = null!;
    private panels: Map<string, InfoPanel> = new Map();
    private currentPanelName: string | null = null;
    private defaultPanelSent = false;

    public get descriptor(): ControlDescriptorInfo {
        return this._descriptor as ControlDescriptorInfo;
    }

    constructor(descriptor: ControlDescriptorInfo, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        this.container = document.createElement('div');
        this.container.id = this.id;       
        this.container.style.overflow = 'clip';
        this.container.style.backgroundColor = '#fff';

        // Create tab header
        this.tabHeader = document.createElement('div');
        this.tabHeader.id = `${this.id}-header`;
        this.tabHeader.style.flexWrap = this.descriptor.multi_line.value ? 'wrap' : 'nowrap';
        this.tabHeader.style.borderBottom = '2px solid #ddd';
        this.tabHeader.style.backgroundColor = this.descriptor.tab_background_color.value !== 'transparent'
            ? this.descriptor.tab_background_color.value
            : '#f9f9f9';
        this.tabHeader.style.padding = '4px';
        this.tabHeader.style.gap = '2px';
        this.tabHeader.style.overflow = 'auto';
        this.container.appendChild(this.tabHeader);

        // Create tab content area
        this.tabContent = document.createElement('div');
        this.tabContent.id = `${this.id}-content`;
        this.tabContent.style.overflow = 'auto';
        this.tabContent.style.backgroundColor = '#fff';
        this.container.appendChild(this.tabContent);

        this.updateElementDescriptor();
        return this.container;
    }

    protected updateElementDescriptor(): void {
        

        if (!this.tabHeader) return;

        // Update styling
        this.tabHeader.style.backgroundColor = this.descriptor.tab_background_color.value !== 'transparent'
            ? this.descriptor.tab_background_color.value
            : '#f9f9f9';

        // Trigger callbacks
        if (this.descriptor.on_show.value) {
            this.windowControl?.windowControl?.InterfaceManager?.RunCommand(this.descriptor.on_show.value);
        }
        this.applyDMFLayout(this.container, this);
    }

    public selectStatPanel(statPanelName: string): void {
        const panel = this.panels.get(statPanelName);
        if (panel) {
            this.selectPanel(statPanelName);
        }
    }

    public createStatPanel(name: string): void {
        if (this.panels.has(name)) {
            return; // Panel already exists
        }

        const statPanel: StatPanel = {
            name,
            type: 'stat',
            element: this.createStatPanelElement(name),
            entries: []
        };

        this.panels.set(name, statPanel);
        this.addTabButton(name);

        // If no panel is selected, select this one
        if (!this.currentPanelName) {
            this.selectPanel(name);
        }

        this.sortPanels();
    }

    public createVerbPanel(name: string): void {
        if (this.panels.has(name)) {
            return; // Panel already exists
        }

        const verbPanel: VerbPanel = {
            name,
            type: 'verb',
            element: this.createVerbPanelElement(name),
            verbs: []
        };

        this.panels.set(name, verbPanel);
        this.addTabButton(name);

        this.sortPanels();
    }

    public hasVerbPanel(name: string): boolean {
        const panel = this.panels.get(name);
        return panel?.type === 'verb';
    }

    public updateStatPanel(panelName: string, lines: Array<{ name: string; value: string; atomRef?: string }>): void {
        const panel = this.panels.get(panelName);
        if (!panel || panel.type !== 'stat') {
            return;
        }

        const statPanel = panel as StatPanel;
        statPanel.entries = lines;
        this.renderStatPanel(statPanel);

        if (!this.defaultPanelSent && this.panels.size > 0) {
            this.defaultPanelSent = true;
            // Send a message indicating first panel has been populated
            // This would trigger server to send more data if needed
        }
    }

    public updateVerbPanel(panelName: string, verbs: Array<{ name: string; ref?: string }>): void {
        const panel = this.panels.get(panelName);
        if (!panel || panel.type !== 'verb') {
            return;
        }

        const verbPanel = panel as VerbPanel;
        verbPanel.verbs = verbs.sort((a, b) => {
            // Sort alphabetically with uppercase first (BYOND behavior)
            return a.name.localeCompare(b.name, undefined, { numeric: false });
        });
        this.renderVerbPanel(verbPanel);
    }

    private createStatPanelElement(name: string): HTMLElement {
        const element = document.createElement('div');
        element.id = `${this.id}-panel-${name}`;
        element.style.display = 'none';
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.overflow = 'auto';
        element.style.padding = '8px';
        return element;
    }

    private createVerbPanelElement(name: string): HTMLElement {
        const element = document.createElement('div');
        element.id = `${this.id}-panel-${name}`;
        element.style.display = 'none';
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.overflow = 'auto';
        element.style.padding = '8px';
        element.style.display = 'grid';
        element.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        element.style.gap = '4px';
        return element;
    }

    private renderStatPanel(panel: StatPanel): void {
        const container = panel.element;
        container.innerHTML = '';

        // Create a grid for stat entries
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.gap = '8px 16px';
        grid.style.alignItems = 'center';

        for (const entry of panel.entries) {
            // Name cell
            const nameCell = document.createElement('div');
            nameCell.textContent = entry.name;
            nameCell.style.fontWeight = 'bold';
            nameCell.style.color = this.descriptor.prefix_color.value !== 'transparent'
                ? this.descriptor.prefix_color.value
                : '#333';
            nameCell.style.fontSize = '11px';
            grid.appendChild(nameCell);

            // Value cell
            const valueCell = document.createElement('div');
            valueCell.style.color = this.descriptor.suffix_color.value !== 'transparent'
                ? this.descriptor.suffix_color.value
                : '#666';
            valueCell.style.fontSize = '11px';

            if (entry.atomRef && this.descriptor.allow_html.value) {
                // Clickable atom reference
                const link = document.createElement('a');
                link.textContent = entry.value;
                link.href = '#';
                link.style.cursor = 'pointer';
                link.style.color = '#0066cc';
                link.style.textDecoration = 'underline';
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Handle atom click - would send to interface manager
                });
                valueCell.appendChild(link);
            } else {
                valueCell.textContent = entry.value;
            }

            grid.appendChild(valueCell);
        }

        container.appendChild(grid);
    }

    private renderVerbPanel(panel: VerbPanel): void {
        const container = panel.element;
        container.innerHTML = '';

        for (const verb of panel.verbs) {
            const verbButton = document.createElement('button');
            verbButton.textContent = verb.name;
            verbButton.style.padding = '8px 12px';
            verbButton.style.border = '1px solid #ccc';
            verbButton.style.backgroundColor = '#f0f0f0';
            verbButton.style.cursor = 'pointer';
            verbButton.style.fontSize = '11px';
            verbButton.style.borderRadius = '3px';
            verbButton.style.whiteSpace = 'normal';
            verbButton.style.wordWrap = 'break-word';

            verbButton.addEventListener('mouseenter', () => {
                verbButton.style.backgroundColor = this.descriptor.highlight_color.value;
                verbButton.style.color = '#fff';
            });

            verbButton.addEventListener('mouseleave', () => {
                verbButton.style.backgroundColor = '#f0f0f0';
                verbButton.style.color = '#000';
            });

            verbButton.addEventListener('click', () => {
                // Handle verb click - would send to interface manager
                if (verb.ref) {
                    this.windowControl?.windowControl?.InterfaceManager?.RunCommand(`__verb_click:${verb.ref}`);
                }
            });

            container.appendChild(verbButton);
        }
    }

    private addTabButton(panelName: string): void {
        const button = document.createElement('button');
        button.textContent = panelName;
        button.style.padding = '8px 16px';
        button.style.border = '1px solid #ccc';
        button.style.backgroundColor = '#e8e8e8';
        button.style.cursor = 'pointer';
        button.style.fontSize = '12px';
        button.style.fontFamily = this.descriptor.tab_font_family.value || 'Arial, sans-serif';
        button.style.fontSize = this.descriptor.tab_font_size.value > 0
            ? `${this.descriptor.tab_font_size.value}px`
            : '12px';
        button.style.borderRadius = '4px 4px 0 0';
        button.style.whiteSpace = 'nowrap';
        button.style.flex = '0 0 auto';
        button.style.color = this.descriptor.tab_text_color.value !== 'transparent'
            ? this.descriptor.tab_text_color.value
            : '#000';

        button.addEventListener('click', () => {
            this.selectPanel(panelName);
        });

        this.tabHeader.appendChild(button);
    }

    private selectPanel(panelName: string): void {
        // Deselect current panel
        if (this.currentPanelName) {
            const oldPanel = this.panels.get(this.currentPanelName);
            if (oldPanel) {
                oldPanel.element.style.display = 'none';
                const oldButton = this.getButtonForPanel(this.currentPanelName);
                if (oldButton) {
                    oldButton.style.backgroundColor = '#e8e8e8';
                }
            }
        }

        // Select new panel
        const newPanel = this.panels.get(panelName);
        if (newPanel) {
            this.currentPanelName = panelName;
            newPanel.element.style.display = 'block';
            const newButton = this.getButtonForPanel(panelName);
            if (newButton) {
                newButton.style.backgroundColor = '#fff';
            }
            this.tabContent.innerHTML = '';
            this.tabContent.appendChild(newPanel.element);
        }
    }

    private getButtonForPanel(panelName: string): HTMLButtonElement | null {
        const buttons = Array.from(this.tabHeader.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent === panelName) || null;
    }

    private sortPanels(): void {
        // Rebuild tab header buttons in sorted order
        const panelNames = Array.from(this.panels.keys()).sort();
        this.tabHeader.innerHTML = '';
        for (const name of panelNames) {
            this.addTabButton(name);
        }
        // Re-select current panel button if any
        if (this.currentPanelName) {
            const btn = this.getButtonForPanel(this.currentPanelName);
            if (btn) {
                btn.style.backgroundColor = '#fff';
            }
        }
    }

    public onShowEvent(): void {
        if (this.descriptor.on_show.value) {
            this.windowControl?.windowControl?.InterfaceManager?.RunCommand(this.descriptor.on_show.value);
        }
    }

    public onHideEvent(): void {
        if (this.descriptor.on_hide.value) {
            this.windowControl?.windowControl?.InterfaceManager?.RunCommand(this.descriptor.on_hide.value);
        }
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
