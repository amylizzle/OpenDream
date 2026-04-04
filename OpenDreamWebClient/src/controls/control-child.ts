import { InterfaceControl } from './interface-control';
import { ControlDescriptorChild } from '../descriptors/control-descriptors';
import { DMFPropertySize, type IDMFProperty } from '../DMF/dmf-property';

export class ControlChild extends InterfaceControl {
    private splitterContainer: HTMLElement = null!;
    private leftPanel: HTMLElement = null!;
    private rightPanel: HTMLElement = null!;
    private splitterHandle: HTMLElement = null!;
    private isDragging = false;
    private dragStartPos = 0;
    private initialSplitterPos = 0;

    public get descriptor(): ControlDescriptorChild {
        return this._descriptor as ControlDescriptorChild;
    }

    constructor(descriptor: ControlDescriptorChild, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public CreateUIElement(): HTMLElement {
        this.splitterContainer = document.createElement('div');
        this.splitterContainer.id = this.id;
        this.splitterContainer.classList.add('CHILD');
        this.splitterContainer.style.position = 'static';
        this.splitterContainer.style.display = 'grid';
        this.splitterContainer.style.width = '100%';
        this.splitterContainer.style.height = '100%';

        // Create left panel
        this.leftPanel = document.createElement('div');
        this.leftPanel.id = `${this.id}-left`;
        this.leftPanel.style.minHeight = '0'; // allow the panel to shrink smaller than its content
        this.leftPanel.style.minWidth = '0';
        this.splitterContainer.appendChild(this.leftPanel);

        // Create splitter handle
        this.splitterHandle = document.createElement('div');
        this.splitterHandle.id = `${this.id}-splitterhandle`;
        // this.splitterHandle.style.position = 'static';
        this.splitterHandle.style.userSelect = 'none';
        
        this.splitterContainer.appendChild(this.splitterHandle);

        // Create right panel
        this.rightPanel = document.createElement('div');
        this.rightPanel.id = `${this.id}-right`;
        this.rightPanel.style.minHeight = '0'; // allow the panel to shrink smaller than its content
        this.rightPanel.style.minWidth = '0';
        this.splitterContainer.appendChild(this.rightPanel);

        // Add event listeners for splitter dragging
        this.setupSplitterDragging();

        // Update the orientation layout
        this.updateOrientation();
        this.updateSplitterPosition();
        this.UpdateElementDescriptor();
        return this.splitterContainer;
    }

    private setupSplitterDragging(): void {
        this.splitterHandle.addEventListener('mousedown', (e: MouseEvent) => {
            this.isDragging = true;
            this.dragStartPos = !this.descriptor.is_vert.value ? e.clientY : e.clientX;
            this.initialSplitterPos = this.descriptor.splitter.value;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (!this.isDragging) return;

            const container = this.splitterContainer;
            const containerSize = !this.descriptor.is_vert.value 
                ? container.clientHeight 
                : container.clientWidth;

            const currentPos = !this.descriptor.is_vert.value ? e.clientY : e.clientX;
            const delta = currentPos - this.dragStartPos;
            const deltaPercent = (delta / containerSize) * 100;
            
            let newSplitterPos = this.initialSplitterPos + deltaPercent;
            newSplitterPos = Math.max(10, Math.min(90, newSplitterPos)); // Clamp between 10% and 90%

            this.descriptor.splitter.value = newSplitterPos;
            this.updateSplitterPosition();
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    private updateSplitterPosition(): void {
        const splitterPercent = this.descriptor.splitter.value/100;
        this.splitterContainer.style.gridTemplateColumns = this.descriptor.is_vert.value ?  `${splitterPercent}fr 5px ${1 - splitterPercent}fr` : '1fr';
        this.splitterContainer.style.gridTemplateRows = this.descriptor.is_vert.value ? '1fr' : `${splitterPercent}fr 5px ${1 - splitterPercent}fr`;
    }

    private updateOrientation(): void {
        const isVertical = this.descriptor.is_vert.value;
        this.updateSplitterPosition();

        if (!isVertical) {
            this.splitterHandle.style.width = '100%';
            this.splitterHandle.style.height = '5px';
            this.splitterHandle.style.cursor = 'row-resize';
            this.splitterHandle.style.borderTop = '1px solid #999';
            this.splitterHandle.style.borderBottom = '1px solid #999';
            this.splitterHandle.style.borderLeft = 'none';
            this.splitterHandle.style.borderRight = 'none';
        } else {
            this.splitterHandle.style.width = '5px';
            this.splitterHandle.style.height = '100%';
            this.splitterHandle.style.cursor = 'col-resize';
            this.splitterHandle.style.borderTop = 'none';
            this.splitterHandle.style.borderBottom = 'none';
            this.splitterHandle.style.borderLeft = '1px solid #999';
            this.splitterHandle.style.borderRight = '1px solid #999';
        }
    }

    protected UpdateElementDescriptor(): void {
        if (!this.splitterHandle) return;

        // Update visibility of splitter handle
        this.splitterHandle.style.display = this.descriptor.show_splitter.value ? 'block' : 'none';

        // Update left and right content if panels exist
        if (this.leftPanel) {
            const leftControl = this.windowControl?.InterfaceManager.Windows.get(this.descriptor.left.asRaw());
            if (leftControl){
                leftControl.descriptor.size = new DMFPropertySize(0,0); //todo this is a hack, should probably just have a layout override property
                const leftElement = leftControl?.CreateUIElement();
                if (leftElement) {
                    this.leftPanel.innerHTML = '';
                    this.leftPanel.appendChild(leftElement);
                }
            }
        }
        if (this.rightPanel) {
            const rightControl = this.windowControl?.InterfaceManager.Windows.get(this.descriptor.right.asRaw());
            if (rightControl){
                rightControl.descriptor.size = new DMFPropertySize(0,0);
                const rightElement = rightControl?.CreateUIElement();
                if (rightElement) {
                    this.rightPanel.innerHTML = '';
                    this.rightPanel.appendChild(rightElement);
                }
            }
        }
        this.ApplyDMFLayout(this.splitterContainer, this);
        // also the left and right panels?

    }

    public Shutdown(): void {
        this.isDragging = false;
        super.Shutdown();
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
