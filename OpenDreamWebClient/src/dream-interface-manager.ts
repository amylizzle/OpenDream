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
import type { DMFWinSet } from "./DMF/dmf-winset";
import type { IDMFProperty } from "./DMF/dmf-property";


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
    private verbSystem: any; // TODO: Implement verb system and type this properly

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
            document.getElementById('app')?.append(this.DefaultWindow?.CreateUIElement()!);

            this.DefaultOutput = this.DefaultWindow.defaultOutput;
            this.DefaultInfo = this.DefaultWindow.defaultInfo;
            this.DefaultMap = this.DefaultWindow.defaultMap;
        }

    }

    public RegisterKeyBinding(_keyCombo: string, _command: string, _isRepeating: boolean): void {};

    FrameUpdate(): void {};


    public Output(control: string, value: string): void {
        let interfaceElement: InterfaceControl;
        let data: string | undefined = undefined;

        if (control !== null) {
            const split = control.split(":");

            interfaceElement = this.FindElementWithId(split[0]) as InterfaceControl;
            if (split.length > 1) {
                data = split[1];
            }
        } else {
            interfaceElement = this.DefaultOutput as InterfaceControl;
        }

        // Optional chaining works just like C# here
        interfaceElement?.Output(value, data);
    }
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

    StopRepeatingCommand(_command: string): void {}

    public RunCommand(fullCommand: string, repeating: boolean = false): void {
        // C# switch with 'when' guards converted to standard if/else for string matching
        if (fullCommand !== null && fullCommand.startsWith(".quit")) {
            console.log(".quit used");
            //TODO close browser main window?
        }
        else if (fullCommand !== null && fullCommand.startsWith(".screenshot")) {
            const split = fullCommand.split(" ");
            this.SaveScreenshot(split.length === 1 || split[1] !== "auto");
        }
        else if (fullCommand !== null && fullCommand.startsWith(".configure")) {
            console.warn(".configure command is not implemented");
        }
        else if (fullCommand !== null && fullCommand.startsWith(".winset")) {
            // Everything after .winset, excluding the space and quotes
            let winsetParams = fullCommand.substring(7); // clip .winset
            winsetParams = winsetParams.trim(); // clip space
            if (winsetParams.startsWith('"') && winsetParams.endsWith('"')) {
                winsetParams = winsetParams.substring(1, winsetParams.length - 1); // clip quotes
            }

            this.WinSet(null, winsetParams);
        }
        else if (fullCommand !== null && fullCommand.startsWith(".output")) {
            const args = fullCommand.split(' ').filter(s => s.length > 0);
            if (args.length !== 3) {
                console.error(`.output command was executed with ${args.length - 1} args instead of 2`);
                return;
            }

            this.Output(args[1], args[2]);
        }
        else {
            // Default case handling verb system
            const firstSpace = fullCommand.indexOf(' ');
            let argsRaw: string[];
            if (firstSpace !== -1) {
                argsRaw = [fullCommand.substring(0, firstSpace), fullCommand.substring(firstSpace + 1).trim()];
            } else {
                argsRaw = [fullCommand];
            }

            const command = argsRaw[0].toLowerCase(); // Case-insensitive

            const ret = this.verbSystem.FindVerbWithCommandName(command);
            if (!ret) {
                return;
            }
            const [verbId, verbSrc, verbInfo] = ret;

            if (argsRaw.length === 1) { // No args given
                if (repeating) {
                    this.verbSystem.StartRepeatingVerb(verbSrc, verbId);
                } else {
                    this.verbSystem.ExecuteVerb(verbSrc, verbId);
                }
            } else { // Attempt to parse the given arguments
                const args: string[] = [];
                let currentArg = "";
                let stringCapture = false;
                const sourceStr = argsRaw[1];

                const processAndAddArg = (argStr: string) => {
                    const wingetHolder = { hadWinget: false };
                    const result = this.HandleEmbeddedWinget(null, argStr, wingetHolder);
                    const wingetSplit = result.split(/[x,]/);

                    if (wingetHolder.hadWinget && wingetSplit.length === 2 &&
                        !isNaN(parseFloat(wingetSplit[0])) && !isNaN(parseFloat(wingetSplit[1]))) {
                        args.push(wingetSplit[0]);
                        args.push(wingetSplit[1]);
                    } else {
                        args.push(result);
                    }
                };

                for (let i = 0; i < sourceStr.length; i++) {
                    const char = sourceStr[i];
                    if (char === '"') {
                        currentArg += '"';
                        if (stringCapture) {
                            processAndAddArg(currentArg);
                            currentArg = "";
                        }
                        stringCapture = !stringCapture;
                        continue;
                    }

                    if (char === ' ' && !stringCapture) {
                        processAndAddArg(currentArg);
                        currentArg = "";
                        continue;
                    }

                    currentArg += char;
                }

                if (currentArg.length > 0) {
                    processAndAddArg(currentArg);
                }

                if (args.length !== verbInfo.Arguments.length) {
                    console.error(
                        `Attempted to call a verb with ${verbInfo.Arguments.length} argument(s) with only ${args.length}: ${fullCommand}`
                    );
                    return;
                }

                const argumentsArr = new Array(verbInfo.Arguments.length);
                for (let i = 0; i < verbInfo.Arguments.length; i++) {
                    const argumentType = verbInfo.Arguments[i].Types;

                    if (argumentType === DreamValueType.Text || argumentType === DreamValueType.Message || argumentType === DreamValueType.CommandText) {
                        argumentsArr[i] = args[i];
                    } else if (argumentType === DreamValueType.Num) {
                        const numArg = parseFloat(args[i]);
                        if (isNaN(numArg)) {
                            console.error(`Invalid number argument "${args[i]}"; ignoring command (${fullCommand})`);
                            return;
                        }
                        argumentsArr[i] = numArg;
                    } else {
                        console.error(`Parsing verb args of type ${argumentType} is unimplemented; ignoring command (${fullCommand})`);
                        return;
                    }
                }

                this.verbSystem.executeVerb(verbSrc, verbId, argumentsArr);
            }
        }
    }

    public HandleEmbeddedWinget(controlId: string | null, value: string, outObj: { hadWinget: boolean }): string {
        outObj.hadWinget = false;

        let result = value;
        let startPos = result.indexOf("[[");
        
        while (startPos > -1) {
            const endPos = result.indexOf("]]", startPos);
            if (endPos === -1) {
                break;
            }

            let inner = result.substring(startPos + 2, endPos);
            const elementSplit = inner.split('.');
            let innerControlId = controlId ?? "";

            if (elementSplit.length > 1) {
                const prefix = innerControlId === "" ? "" : innerControlId + ".";
                // elementSplit[..^1] in C# skips the last element. 
                // In TS, slice(0, -1) does the exact same thing.
                innerControlId = prefix + elementSplit.slice(0, -1).join(".");
                inner = elementSplit[elementSplit.length - 1]; // elementSplit[^1]
            }

            const innerResult = this.WinGet(innerControlId, inner);
            outObj.hadWinget = true;
            
            result = result.substring(0, startPos) + innerResult + result.substring(endPos + 2);
            startPos = result.indexOf("[[");
        }

        return result;
    }

    public WinSet(controlId: string | null, winsetParams: string): void {
        let parser: DMFParser;
        try {
            const lexer = new DMFLexer(winsetParams);
            parser = new DMFParser(lexer);
        } catch (e) {
            console.error(`Error parsing winset: ${e}`);
            return;
        }

        const checkParserErrors = (): boolean => {
            if (parser.Errors.length <= 0)
                return false;

            for (const error of parser.Errors) {
                console.error(error);
            }
            return true;
        };

        if (!controlId) {
            const winSets = parser.GlobalWinSet();
            if (checkParserErrors())
                return;

            const elementOverrideObj = winSets.find((winSet: DMFWinSet) => winSet.element === null && winSet.attribute === "id");
            const elementOverride = elementOverrideObj ? elementOverrideObj.value : null;

            for (const winSet of winSets) {
                if (winSet.attribute === "id")
                    continue;

                const elementId = winSet.element ?? elementOverride;

                if (elementId === null) {
                    if (winSet.attribute === "command") {
                        const holder = { hadWinget: false };
                        this.RunCommand(this.HandleEmbeddedWinget(controlId, winSet.value, holder));
                    } else {
                        console.error(`Invalid global winset "${winsetParams}"`);
                    }
                } else {
                    if (winSet.trueStatements) {
                        const conditionalElement = this.FindElementWithId(elementId);
                        if (!conditionalElement) {
                            console.error(`Invalid element on ternary condition "${elementId}"`);
                        } else {
                            if (conditionalElement.TryGetProperty(winSet.attribute)?.equals(winSet.value)) {
                                for (const statement of winSet.trueStatements) {
                                    const statementElementId = statement.element ?? elementId;
                                    const statementElement = this.FindElementWithId(statementElementId);
                                    if (statementElement) {
                                        const holder = { hadWinget: false };
                                        statementElement.SetProperty(statement.attribute, this.HandleEmbeddedWinget(statementElementId, statement.value, holder), true);
                                    } else {
                                        console.error(`Invalid element on ternary "${statementElementId}"`);
                                    }
                                }
                            } else if (winSet.falseStatements) {
                                for (const statement of winSet.falseStatements) {
                                    const statementElementId = statement.element ?? elementId;
                                    const statementElement = this.FindElementWithId(statementElementId);
                                    if (statementElement) {
                                        const holder = { hadWinget: false };
                                        statementElement.SetProperty(statement.attribute, this.HandleEmbeddedWinget(statementElementId, statement.value, holder), true);
                                    } else {
                                        console.error(`Invalid element on ternary "${statementElementId}"`);
                                    }
                                }
                            }
                        }
                    } else {
                        const element = this.FindElementWithId(elementId);
                        if (element) {
                            const holder = { hadWinget: false };
                            element.SetProperty(winSet.attribute, this.HandleEmbeddedWinget(elementId, winSet.value, holder), true);
                        } else {
                            console.error(`Invalid element "${elementId}"`);
                        }
                    }
                }
            }
        } else {
            const element = this.FindElementWithId(controlId);
            const attributes = parser.Attributes();

            if (checkParserErrors())
                return;

            if (!element && attributes.has("parent")) {
                const parentId = attributes.get("parent");
                const parent = parentId ? this.FindElementWithId(parentId) : undefined;
                if (!parent) {
                    console.error(`Attempted to create an element with nonexistent parent "${parentId}" (${winsetParams})`);
                    return;
                }

                attributes.set("id", controlId);
                const childDescriptor = parent.descriptor.CreateChildDescriptor(attributes);
                if (!childDescriptor)
                    return;

                parent.AddChild(childDescriptor);
            } else if (element) {
                for (const [key, value] of attributes.entries()) {
                    element.SetProperty(key, value, true);
                }
            } else {
                console.error(`Invalid element "${controlId}"`);
            }
        }
    }

    public WinGet(controlId: string, queryValue: string, forceJson: boolean = false, forceSnowflake: boolean = false): string {
        const parseAndTryGet = (element: InterfaceElement, query: string, holder: { result: string }): boolean => {
            const querySplit = query.split(" as ");
            let propResult: IDMFProperty | undefined = undefined;

            if (querySplit.length !== 2) {
                propResult = element.TryGetProperty(query);
                if (propResult) {
                    holder.result = forceJson ? propResult.asJson() : forceSnowflake ? propResult.asSnowflake() : propResult.asRaw();
                    return true;
                } else {
                    holder.result = "";
                    return false;
                }
            } else {
                propResult = element.TryGetProperty(querySplit[0]);
                if (!propResult) {
                    holder.result = "";
                    return false;
                }

                if (forceJson) {
                    holder.result = propResult.asJson();
                    return true;
                } else if (forceSnowflake) {
                    holder.result = propResult.asSnowflake();
                    return true;
                }

                switch (querySplit[1]) {
                    case "arg": holder.result = propResult.asArg(); break;
                    case "escaped": holder.result = propResult.asEscaped(); break;
                    case "string": holder.result = propResult.asString(); break;
                    case "params": holder.result = propResult.asParams(); break;
                    case "json": holder.result = propResult.asJson(); break;
                    case "json-dm": holder.result = propResult.asJsonDM(); break;
                    case "raw": holder.result = propResult.asRaw(); break;
                    default:
                        console.error(`Invalid winget query function "${querySplit[1]}" in "${query}"`);
                        holder.result = "";
                        return false;
                }
                return true;
            }
        };

        const getProperty = (elementId: string): string => {
            const element = this.FindElementWithId(elementId);
            if (!element) {
                console.error(`Could not winget element ${elementId} because it does not exist`);
                return "";
            }

            const multiQuery = queryValue.split(';').map(s => s.trim()).filter(s => s.length > 0);
            if (multiQuery.length > 1) {
                let result = "";
                for (const query of multiQuery) {
                    const holder = { result: "" };
                    if (!parseAndTryGet(element, query, holder)) {
                        console.error(`Could not winget property ${query} on ${element.id}`);
                    }
                    result += query + "=" + holder.result + ";";
                }
                return result.endsWith(';') ? result.slice(0, -1) : result;
            } else {
                const holder = { result: "" };
                if (parseAndTryGet(element, queryValue, holder)) {
                    return holder.result;
                }
            }

            console.error(`Could not winget property ${queryValue} on ${element.id}`);
            return "";
        };

        const elementIds = controlId.split(';').map(s => s.trim()).filter(s => s.length > 0);

        if (elementIds.length === 0) {
            switch (queryValue) {
                case "hwmode": return "true";
                case "windows":
                    return Array.from(this.Windows.entries())
                        .filter(([_, value]) => !value.descriptor.is_pane.value)
                        .map(([key, _]) => key)
                        .join(';');
                case "panes":
                    return Array.from(this.Windows.entries())
                        .filter(([_, value]) => value.descriptor.is_pane.value)
                        .map(([key, _]) => key)
                        .join(';');
                case "menus": return Array.from(this.Menus.keys()).join(';');
                case "macros": return Array.from(this.MacroSets.keys()).join(';');
                default:
                    console.error(`Special winget "${queryValue}" is not implemented`);
                    return "";
            }
        } else if (elementIds.length === 1) {
            return getProperty(elementIds[0]);
        }

        const resultSegments: string[] = [];
        for (let i = 0; i < elementIds.length; i++) {
            const elementId = elementIds[i];
            resultSegments.push(`${elementId}.${queryValue}=${getProperty(elementId)}`);
        }

        return resultSegments.join(';');
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
