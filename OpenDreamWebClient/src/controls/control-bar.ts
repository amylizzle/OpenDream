import { InterfaceControl } from './interface-control';
import { ControlDescriptorBar } from '../descriptors/control-descriptors';

export class ControlBar extends InterfaceControl {
    private barElement?: HTMLElement;
    private fillElement?: HTMLElement;
    private isDragging = false;

    public get descriptor(): ControlDescriptorBar {
        return this._descriptor as ControlDescriptorBar;
    }

    constructor(descriptor: ControlDescriptorBar, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public createUIElement(): HTMLElement {
        const container = document.createElement('div');
        container.classList.add('control-bar-container');
        
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.overflow = 'scroll';

        const dir = this.descriptor.dir.value;

        if (dir === 'clockwise' || dir === 'counterclockwise') {
            // Arc bar rendering
            this.barElement = this.createArcBar();
        } else {
            // Straight bar rendering
            this.barElement = this.createStraightBar();
        }

        container.appendChild(this.barElement);
        this.updateElementDescriptor();

        return container;
    }

    private createStraightBar(): HTMLElement {
        const barWrapper = document.createElement('div');
        barWrapper.classList.add('control-bar');
        barWrapper.style.position = 'static';
        barWrapper.style.display = 'flex';
        barWrapper.style.alignItems = 'center';
        barWrapper.style.justifyContent = 'flex-start';

        const dir = this.descriptor.dir.value;
        const width = this.descriptor.width.value || 10;
        const value = Math.min(Math.max(this.descriptor.value.value, 0), 100);
        const barColor = this.descriptor.bar_color.value;
        const isSlider = this.descriptor.is_slider.value;

        // Set bar dimensions based on direction
        if (dir === 'east') {
            barWrapper.style.width = '100%';
            barWrapper.style.height = `${width}px`;
            barWrapper.style.flexDirection = 'row';
            barWrapper.style.backgroundColor = '#ddd';
            barWrapper.style.border = '1px solid #999';
            barWrapper.style.borderRadius = '2px';
        } else if (dir === 'west') {
            barWrapper.style.width = '100%';
            barWrapper.style.height = `${width}px`;
            barWrapper.style.flexDirection = 'row-reverse';
            barWrapper.style.backgroundColor = '#ddd';
            barWrapper.style.border = '1px solid #999';
            barWrapper.style.borderRadius = '2px';
        } else if (dir === 'south') {
            barWrapper.style.height = '100%';
            barWrapper.style.width = `${width}px`;
            barWrapper.style.flexDirection = 'column';
            barWrapper.style.backgroundColor = '#ddd';
            barWrapper.style.border = '1px solid #999';
            barWrapper.style.borderRadius = '2px';
        } else if (dir === 'north') {
            barWrapper.style.height = '100%';
            barWrapper.style.width = `${width}px`;
            barWrapper.style.flexDirection = 'column-reverse';
            barWrapper.style.backgroundColor = '#ddd';
            barWrapper.style.border = '1px solid #999';
            barWrapper.style.borderRadius = '2px';
        }

        // Create fill bar
        this.fillElement = document.createElement('div');
        this.fillElement.classList.add('control-bar-fill');
        this.fillElement.style.backgroundColor = barColor || '#0066ff';
        this.fillElement.style.transition = isSlider ? 'none' : 'width 0.2s ease';

        if (dir === 'east' || dir === 'west') {
            this.fillElement.style.width = `${value}%`;
            this.fillElement.style.height = '100%';
        } else if (dir === 'south' || dir === 'north') {
            this.fillElement.style.width = '100%';
            this.fillElement.style.height = `${value}%`;
        }

        barWrapper.appendChild(this.fillElement);

        // Add slider handle if needed
        if (isSlider) {
            this.setupSliderInteraction(barWrapper);
        }

        return barWrapper;
    }

    private createArcBar(): HTMLElement {
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        // Set canvas size
        setTimeout(() => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                canvas.width = rect.width * window.devicePixelRatio;
                canvas.height = rect.height * window.devicePixelRatio;
                this.drawArcBar(canvas);
            }
        }, 0);

        return canvas;
    }

    private drawArcBar(canvas: HTMLCanvasElement): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;

        const dir = this.descriptor.dir.value;
        const angle1 = this.descriptor.angle1.value * (Math.PI / 180);
        const angle2 = this.descriptor.angle2.value * (Math.PI / 180);
        const value = Math.min(Math.max(this.descriptor.value.value, 0), 100);
        const barColor = this.descriptor.bar_color.value;

        // Draw background arc (light gray)
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angle1, angle2);
        ctx.stroke();

        // Draw filled arc
        const currentAngle = angle1 + (angle2 - angle1) * (value / 100);
        ctx.strokeStyle = barColor || '#0066ff';
        ctx.lineWidth = 8;
        ctx.beginPath();

        if (dir === 'counterclockwise') {
            ctx.arc(centerX, centerY, radius, angle2, currentAngle, true);
        } else {
            ctx.arc(centerX, centerY, radius, angle1, currentAngle);
        }
        ctx.stroke();
    }

    private setupSliderInteraction(barElement: HTMLElement): void {
        const dir = this.descriptor.dir.value;
        const isVertical = dir === 'north' || dir === 'south';

        barElement.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.updateSliderValue(barElement, e, isVertical);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.updateSliderValue(barElement, e, isVertical);
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        barElement.addEventListener('click', (e) => {
            this.updateSliderValue(barElement, e, isVertical);
        });
    }

    private updateSliderValue(barElement: HTMLElement, event: MouseEvent, isVertical: boolean): void {
        const rect = barElement.getBoundingClientRect();
        let percentage = 0;

        if (isVertical) {
            const relativeY = event.clientY - rect.top;
            percentage = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
        } else {
            const relativeX = event.clientX - rect.left;
            percentage = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
        }

        // Update descriptor value
        this.descriptor.value.value = percentage;

        // Update fill element immediately
        if (this.fillElement) {
            if (isVertical) {
                this.fillElement.style.height = `${percentage}%`;
            } else {
                this.fillElement.style.width = `${percentage}%`;
            }
        }

        // Trigger on_change callback
        const onChangeCommand = this.descriptor.on_change.value;
        if (onChangeCommand) {
            const command = onChangeCommand.replace('[[*]]', percentage.toString());
            this.windowControl?.InterfaceManager?.RunCommand(command);
        }
    }

    protected updateElementDescriptor(): void {
        // Redraw if canvas-based (arc bar)
        if (this.barElement?.tagName === 'CANVAS') {
            this.drawArcBar(this.barElement as HTMLCanvasElement);
        } else if (this.fillElement) {
            // Update fill percentage for straight bars
            const dir = this.descriptor.dir.value;
            const value = Math.min(Math.max(this.descriptor.value.value, 0), 100);
            const barColor = this.descriptor.bar_color.value;

            if (dir === 'east' || dir === 'west') {
                this.fillElement.style.width = `${value}%`;
            } else if (dir === 'south' || dir === 'north') {
                this.fillElement.style.height = `${value}%`;
            }

            this.fillElement.style.backgroundColor = barColor || '#0066ff';
        }
    }

    public setProperty(property: string, value: string): void {
        const underscoreKey = property.replace(/-/g, "_").toLowerCase();

        // Handle specific properties that need special updates
        switch (underscoreKey) {
            case 'value':
            case 'dir':
            case 'bar_color':
            case 'is_slider':
            case 'angle1':
            case 'angle2':
                super.setProperty(property, value);
                // Redraw the bar after value change
                if (this.barElement) {
                    const parent = this.barElement.parentElement;
                    if (parent) {
                        parent.innerHTML = '';
                        this.barElement = undefined;
                        this.fillElement = undefined;

                        const newBar = this.descriptor.dir.value === 'clockwise' || this.descriptor.dir.value === 'counterclockwise'
                            ? this.createArcBar()
                            : this.createStraightBar();

                        parent.appendChild(newBar);
                        this.barElement = newBar;
                    }
                }
                return;
        }

        super.setProperty(property, value);
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
