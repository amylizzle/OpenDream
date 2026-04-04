import { ControlInfo } from "./controls/control-info";
import { ControlMap } from "./controls/control-map";
import { ControlOutput } from "./controls/control-output";
import { ControlWindow } from "./controls/control-window";
import { DMFLexer } from "./DMF/dmf-lexer";
import { DMFParser } from "./DMF/dmf-parser";
import { InterfaceDescriptor } from "./descriptors/interface-descriptor";
import { InterfaceMenu } from "./controls/interface-menu";
import { InterfaceMacroSet } from "./controls/interface-macro";
import { InterfaceElement } from "./controls/interface-element";
import { InterfaceControl } from "./controls/interface-control";


export class DreamWebInterfaceManager {
    public Windows: Map<string, ControlWindow> = new Map();
    public Menus: Map<string, InterfaceMenu> = new Map();
    public MacroSets: Map<string, InterfaceMacroSet> = new Map();

    public InterfaceDescriptor: InterfaceDescriptor | null = null;
    DefaultWindow?: ControlWindow;
    DefaultOutput?: ControlOutput;
    DefaultInfo?: ControlInfo;
    DefaultMap?: ControlMap;

    View: {x: number, y: number} = {x: 13, y: 13};
    ShowPopupMenus: boolean = true;
    IconSize: number = 32;
    //Cursors: CursorHolder;

    public LoadInterfaceFromSource(source: string): void {
        const lexer = new DMFLexer(source)
        const parser = new DMFParser(lexer)
        this.InterfaceDescriptor = parser.Interface()

        if (parser.Errors.length > 0) {
            console.error('DMF parsing errors:', parser.Errors)
        }

        this.LoadInterface();
    }

    private LoadInterface(): void {
        if (!this.InterfaceDescriptor) {
            console.error('No interface descriptor loaded.')
            return;
        }

        // Load menus
        for (const menuDescriptor of this.InterfaceDescriptor.menuDescriptors) {
            const menu = new InterfaceMenu(menuDescriptor, this)
            this.Menus.set(menu.id, menu)
        }

        // Load macro sets
        for (const macroSetDescriptor of this.InterfaceDescriptor.macroSetDescriptors) {
            const macroSet = new InterfaceMacroSet(macroSetDescriptor, this)
            this.MacroSets.set(macroSet.id, macroSet)
        }

        // Load windows
        for (const windowDescriptor of this.InterfaceDescriptor.windowDescriptors) {
            const window = new ControlWindow(windowDescriptor, this)
            this.Windows.set(window.id, window)

            if (windowDescriptor.is_default.value) {
                this.DefaultWindow = window
            }
        }

        // Set default output, info, and map controls if specified
        if (this.DefaultWindow) {
            this.DefaultOutput = this.DefaultWindow.defaultOutput;
            this.DefaultInfo = this.DefaultWindow.defaultInfo;
            this.DefaultMap = this.DefaultWindow.defaultMap;
        }

    }

    public RegisterKeyBinding(_keyCombo: string, _command: string, _isRepeating: boolean): void {};

    FrameUpdate(): void {};

    /**
     * Find an interface element (control, menu, macro, etc.) by ID
     */
    public FindElementWithId(elementId: string): InterfaceElement | undefined {
        // Check windows
        if (this.Windows.has(elementId)) {
            return this.Windows.get(elementId);
        }

        // Check controls within windows (recursive)
        for (const window of this.Windows.values()) {
            const control = this.findControlInWindow(window, elementId);
            if (control) return control;
        }

        // Check menus
        for (const menu of this.Menus.values()) {
            if (menu.id === elementId) return menu;
            // TODO: Check menu items
        }

        // Check macro sets
        for (const macroSet of this.MacroSets.values()) {
            if (macroSet.id === elementId) return macroSet;
            // TODO: Check individual macros
        }

        return undefined;
    }

    private findControlInWindow(window: ControlWindow, elementId: string): InterfaceControl | undefined {
        for (const control of window.childControls) {
            if (control.id === elementId) {
                return control;
            }
            // Recursively search in child windows/containers
            if ('childControls' in control) {
                const found = this.findControlInWindow(control as ControlWindow, elementId);
                if (found) return found;
            }
        }
        return undefined;
    }

    SaveScreenshot(_openDialog: boolean): void {};

    OpenAlert(
        title: string,
        message: string,
        button1: string ,
        button2?: string,
        button3?: string,
        onClose?: (valueType: DreamValueType, value: unknown) => void,
    ): void {

    }

    Prompt(
        types: DreamValueType,
        title: string,
        message: string,
        defaultValue: string,
        onClose?: (valueType: DreamValueType, value: unknown) => void,
    ): void {

    }

    RunCommand(fullCommand: string, _isRepeating?: boolean): void {
        console.log('RunCommand:', fullCommand);
        // TODO: Implement command execution (verb calls, internal commands, etc.)
    }

    StopRepeatingCommand(_command: string): void {}

    /**
     * Set properties on an interface element via WinSet syntax
     * Syntax: "element.property=value;element2.property2=value2"
     */
    public WinSet(controlId: string | null, winsetParams: string): void {
        console.log(`WinSet: controlId=${controlId}, winsetParams=${winsetParams}`);
    }

    /**
     * Get a property value from an interface element via WinGet syntax
     */
    public WinGet(controlId: string, queryValue: string, _forceJson?: boolean, _forceSnowflake?: boolean): string {
        console.log(`WinGet: controlId=${controlId}, queryValue=${queryValue}`);
        return ""
    }
}

export enum DreamValueType {
    AllAtomTypes =  0x4 | 0x8 | 0x10 | 0x80, //Obj | Mob | Turf | Area

    Anything = 0x0,
    Null = 0x1,
    Text = 0x2,
    Obj = 0x4,
    Mob = 0x8,
    Turf = 0x10,
    Num = 0x20,
    Message = 0x40,
    Area = 0x80,
    Color = 0x100,
    File = 0x200,
    CommandText = 0x400,
    Sound = 0x800,
    Icon = 0x1000,

    //Byond here be dragons
    Unimplemented = 0x2000, // Marks that a method or property is not implemented. Throws a compiler warning if accessed.
    CompiletimeReadonly = 0x4000, // Marks that a property can only ever be read from, never written to. This is a const-ier version of const, for certain standard values like list.type
}
