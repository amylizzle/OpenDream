import { InterfaceControl } from './interface-control';
import { ControlDescriptorBrowser } from '../descriptors/control-descriptors';

export class ControlBrowser extends InterfaceControl {
    private container: HTMLElement = null!;
    private iframe: HTMLIFrameElement = null!;
    private currentUrl: string = 'about:blank';
    private messageListenerHandler: ((e: MessageEvent) => void) | null = null;

    public get descriptor(): ControlDescriptorBrowser {
        return this._descriptor as ControlDescriptorBrowser;
    }

    constructor(descriptor: ControlDescriptorBrowser, windowControl?: ControlWindow) {
        super(descriptor, windowControl);
    }

    public CreateUIElement(): HTMLElement {
        this.container = document.createElement('div');
        this.container.id = this.id;
        this.container.classList.add('BROWSER');
        this.container.style.overflow = 'scroll';
        this.container.style.backgroundColor = '#fff';

        // Optional address bar
        if (this.descriptor.show_url.value) {
            const addressBar = document.createElement('div');
            addressBar.style.padding = '4px 8px';
            addressBar.style.borderBottom = '1px solid #ccc';
            addressBar.style.backgroundColor = '#f5f5f5';
            addressBar.style.fontSize = '12px';
            addressBar.style.overflow = 'scroll';
            addressBar.style.textOverflow = 'ellipsis';
            addressBar.style.whiteSpace = 'nowrap';
            addressBar.textContent = this.currentUrl;
            this.container.appendChild(addressBar);
        }

        // iframe for content
        this.iframe = document.createElement('iframe');
        this.iframe.id = `${this.id}-iframe`;
        this.iframe.style.flex = '1';
        this.iframe.style.border = 'none';
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.sandbox.add('allow-same-origin');
        this.iframe.sandbox.add('allow-scripts');
        this.iframe.sandbox.add('allow-popups');
        this.iframe.src = this.currentUrl;
        this.container.appendChild(this.iframe);

        // Set up message listener for iframe communication
        this.messageListenerHandler = this.handleIFrameMessage.bind(this);
        window.addEventListener('message', this.messageListenerHandler);

        // Set up BYOND protocol link interceptor in iframe
        this.setupByondProtocolHandling();

        this.UpdateElementDescriptor();
        return this.container;
    }

    protected UpdateElementDescriptor(): void {
        

        if (this.descriptor.on_show.value) {
            this.windowControl?.windowControl?.InterfaceManager?.RunCommand(this.descriptor.on_show.value);
        }
        this.ApplyDMFLayout(this.container, this);
    }

    public setFileSource(filepath: string | null): void {
        if (filepath) {
            // Convert filepath to a URL that the iframe can load
            // Format: http://127.0.0.1/ + filepath (for compatibility)
            this.currentUrl = 'http://127.0.0.1/' + filepath;
        } else {
            this.currentUrl = 'about:blank';
        }

        if (this.iframe) {
            this.iframe.src = this.currentUrl;
        }

        // Update address bar if visible
        const addressBar = this.container.querySelector('div[style*="border-bottom"]');
        if (addressBar) {
            addressBar.textContent = this.currentUrl;
        }
    }

    public output(value: string, jsFunction?: string): void {
        if (!jsFunction || !this.iframe.contentDocument) return;

        // Parse parameters - they may be URL encoded and separated by &
        const parts = value.split('&');
        const preparedParts: string[] = [];

        for (const part of parts) {
            // Decode and escape for JavaScript
            const decoded = decodeURIComponent(part);
            // Escape for JS string literal
            const escaped = JSON.stringify(decoded);
            preparedParts.push(escaped);
        }

        // Execute JS in iframe via script tag (safer than eval)
        try {
            const script = this.iframe.contentDocument.createElement('script');
            script.textContent = `${jsFunction}(${preparedParts.join(',')})`;
            this.iframe.contentDocument.body.appendChild(script);
            script.remove();
        } catch (e) {
            console.error(`Error executing JS in browser: ${e}`);
        }
    }

    private setupByondProtocolHandling(): void {
        // Inject a script into the iframe to handle byond:// links
        if (!this.iframe.contentWindow) return;

        try {
            const script = this.iframe.contentDocument?.createElement('script');
            if (script) {
                script.textContent = `
                    document.addEventListener('click', function(e) {
                        const link = e.target.closest('a');
                        if (link && link.href.startsWith('byond://')) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Post message to parent window to handle byond protocol
                            window.parent.postMessage({
                                type: 'byond_link',
                                url: link.href
                            }, '*');
                        }
                    });
                `;
                this.iframe.contentDocument?.head.appendChild(script);
            }
        } catch (e) {
            console.warn('Could not inject BYOND protocol handler:', e);
        }
    }

    private handleIFrameMessage(event: MessageEvent): void {
        // Only accept messages for this control
        if (event.source !== this.iframe.contentWindow) {
            return;
        }

        const data = event.data;

        if (data.type === 'byond_link') {
            this.handleByondLink(data.url);
        }
    }

    private handleByondLink(url: string): void {
        try {
            const byondUrl = new URL(url);

            if (byondUrl.protocol !== 'byond:') return;

            const host = byondUrl.hostname;
            const query = byondUrl.search.substring(1); // Remove leading ?

            switch (host) {
                case 'winset':
                    this.handleEmbeddedWinset(query);
                    break;
                case 'winget':
                    this.handleEmbeddedWinget(query);
                    break;
                default:
                    // Send as topic message to server
                    this.windowControl?.windowControl?.InterfaceManager?.RunCommand(`__topic:${query}`);
                    break;
            }
        } catch (e) {
            console.error(`Error handling BYOND link: ${e}`);
        }
    }

    private handleEmbeddedWinset(query: string): void {
        // Parse query string: replace ';' with '&' for consistency
        const params = new URLSearchParams(query.replace(/;/g, '&'));

        // Extract element (target control)
        const element = params.get('element');
        params.delete('element');

        // Build winset command
        const commands: string[] = [];
        for (const [key, value] of params.entries()) {
            commands.push(`${key}="${value}"`);
        }

        const winsetCmd = commands.join(';');
        
        // Execute winset
        if (element) {
            this.windowControl?.windowControl?.InterfaceManager?.RunCommand(`__winset:${element}:${winsetCmd}`);
        } else {
            this.windowControl?.windowControl?.InterfaceManager?.RunCommand(`__winset:::${winsetCmd}`);
        }
    }

    private handleEmbeddedWinget(query: string): void {
        // Parse query string
        const params = new URLSearchParams(query.replace(/;/g, '&'));

        const elementId = params.get('id');
        let properties = params.get('property');
        const callback = params.get('callback');

        if (!elementId || !properties || !callback) {
            console.error('Required parameter missing in winget: id, property, or callback');
            return;
        }

        // Handle wildcard property
        if (properties === '*') {
            properties = 'size';
        }

        // Split multiple properties by comma
        const propList = properties.split(',').map(p => p.trim());

        // Build result object
        const resultObj: { [key: string]: unknown } = {};

        // For now, we'll need to call winget on the server side
        // In a real implementation, you'd query the UI state
        for (const prop of propList) {
            resultObj[prop] = this.windowControl?.windowControl?.InterfaceManager?.RunCommand(
                `__winget:${elementId}:${prop}`
            ) || null;
        }

        // Execute callback with result
        const json = JSON.stringify(resultObj);
        this.output(json, callback);
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

    public Shutdown(): void {
        if (this.messageListenerHandler) {
            window.removeEventListener('message', this.messageListenerHandler);
        }
        super.Shutdown();
    }
}

export type ControlWindow = import('./control-window').ControlWindow;
