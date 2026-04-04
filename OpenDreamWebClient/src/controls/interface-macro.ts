import { InterfaceElement } from "./interface-element";
import { MacroDescriptor, MacroSetDescriptor } from "../descriptors/macro-descriptor";

export enum Key {
    // Letters
    A = "KeyA", B = "KeyB", C = "KeyC", D = "KeyD", E = "KeyE",
    F = "KeyF", G = "KeyG", H = "KeyH", I = "KeyI", J = "KeyJ",
    K = "KeyK", L = "KeyL", M = "KeyM", N = "KeyN", O = "KeyO",
    P = "KeyP", Q = "KeyQ", R = "KeyR", S = "KeyS", T = "KeyT",
    U = "KeyU", V = "KeyV", W = "KeyW", X = "KeyX", Y = "KeyY",
    Z = "KeyZ",

    // Numbers
    Num0 = "Digit0", Num1 = "Digit1", Num2 = "Digit2", Num3 = "Digit3",
    Num4 = "Digit4", Num5 = "Digit5", Num6 = "Digit6", Num7 = "Digit7",
    Num8 = "Digit8", Num9 = "Digit9",

    // Function keys
    F1 = "F1", F2 = "F2", F3 = "F3", F4 = "F4", F5 = "F5",
    F6 = "F6", F7 = "F7", F8 = "F8", F9 = "F9", F10 = "F10",
    F11 = "F11", F12 = "F12", F13 = "F13", F14 = "F14", F15 = "F15",

    // Numpad
    NumpadNum0 = "Numpad0", NumpadNum1 = "Numpad1", NumpadNum2 = "Numpad2",
    NumpadNum3 = "Numpad3", NumpadNum4 = "Numpad4", NumpadNum5 = "Numpad5",
    NumpadNum6 = "Numpad6", NumpadNum7 = "Numpad7", NumpadNum8 = "Numpad8",
    NumpadNum9 = "Numpad9",

    // Directions
    Up = "ArrowUp", Down = "ArrowDown", Left = "ArrowLeft", Right = "ArrowRight",
    Home = "Home", End = "End", PageUp = "PageUp", PageDown = "PageDown",

    // Special
    Return = "Enter", Escape = "Escape", Tab = "Tab", Space = "Space",
    BackSpace = "Backspace", Insert = "Insert", Delete = "Delete",
    Pause = "Pause",

    // Modifiers
    Shift = "Shift", Control = "Control", Alt = "Alt",
    LSystem = "MetaLeft", RSystem = "MetaRight",

    // Numpad operators
    NumpadMultiply = "NumpadMultiply", NumpadAdd = "NumpadAdd",
    NumpadSubtract = "NumpadSubtract", NumpadDivide = "NumpadDivide",

    // Punctuation
    SemiColon = "Semicolon", Comma = "Comma", Period = "Period",
    Tilde = "Backquote",

    Unknown = "Unknown"
}

export interface ParsedKeybind {
    up: boolean;
    rep: boolean;
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    isAny: boolean;
    key?: Key;
}

const keyNameToKey: Map<string, Key> = new Map([
    ["A", Key.A], ["B", Key.B], ["C", Key.C], ["D", Key.D], ["E", Key.E],
    ["F", Key.F], ["G", Key.G], ["H", Key.H], ["I", Key.I], ["J", Key.J],
    ["K", Key.K], ["L", Key.L], ["M", Key.M], ["N", Key.N], ["O", Key.O],
    ["P", Key.P], ["Q", Key.Q], ["R", Key.R], ["S", Key.S], ["T", Key.T],
    ["U", Key.U], ["V", Key.V], ["W", Key.W], ["X", Key.X], ["Y", Key.Y],
    ["Z", Key.Z],
    ["0", Key.Num0], ["1", Key.Num1], ["2", Key.Num2], ["3", Key.Num3],
    ["4", Key.Num4], ["5", Key.Num5], ["6", Key.Num6], ["7", Key.Num7],
    ["8", Key.Num8], ["9", Key.Num9],
    ["F1", Key.F1], ["F2", Key.F2], ["F3", Key.F3], ["F4", Key.F4],
    ["F5", Key.F5], ["F6", Key.F6], ["F7", Key.F7], ["F8", Key.F8],
    ["F9", Key.F9], ["F10", Key.F10], ["F11", Key.F11], ["F12", Key.F12],
    ["F13", Key.F13], ["F14", Key.F14], ["F15", Key.F15],
    ["NUMPAD0", Key.NumpadNum0], ["NUMPAD1", Key.NumpadNum1], ["NUMPAD2", Key.NumpadNum2],
    ["NUMPAD3", Key.NumpadNum3], ["NUMPAD4", Key.NumpadNum4], ["NUMPAD5", Key.NumpadNum5],
    ["NUMPAD6", Key.NumpadNum6], ["NUMPAD7", Key.NumpadNum7], ["NUMPAD8", Key.NumpadNum8],
    ["NUMPAD9", Key.NumpadNum9],
    ["NORTH", Key.Up], ["SOUTH", Key.Down], ["EAST", Key.Right], ["WEST", Key.Left],
    ["NORTHWEST", Key.Home], ["SOUTHWEST", Key.End], ["NORTHEAST", Key.PageUp],
    ["SOUTHEAST", Key.PageDown],
    ["RETURN", Key.Return], ["ESCAPE", Key.Escape], ["TAB", Key.Tab],
    ["SPACE", Key.Space], ["BACK", Key.BackSpace], ["INSERT", Key.Insert],
    ["DELETE", Key.Delete], ["PAUSE", Key.Pause],
    ["LWIN", Key.LSystem], ["RWIN", Key.RSystem],
    ["MULTIPLY", Key.NumpadMultiply], ["ADD", Key.NumpadAdd],
    ["SUBTRACT", Key.NumpadSubtract], ["DIVIDE", Key.NumpadDivide],
    [";", Key.SemiColon], [",", Key.Comma], [".", Key.Period], ["`", Key.Tilde],
    ["SHIFT", Key.Shift], ["CTRL", Key.Control], ["ALT", Key.Alt],
]);

let keyToKeyName: Map<Key, string> | null = null;

export function keyNameToKeyCode(key: string): Key {
    return keyNameToKey.get(key) || Key.Unknown;
}

export function keyCodeToKeyName(key: Key): string | undefined {
    if (!keyToKeyName) {
        keyToKeyName = new Map();
        for (const [name, keyCode] of keyNameToKey.entries()) {
            keyToKeyName.set(keyCode, name);
        }
    }

    return keyToKeyName.get(key);
}

export function parseKeybind(keybind: string): ParsedKeybind {
    const parsed: ParsedKeybind = {
        up: false,
        rep: false,
        shift: false,
        ctrl: false,
        alt: false,
        isAny: false
    };

    let foundKey = false;
    const parts = keybind.toUpperCase().split("+");

    for (const part of parts) {
        switch (part) {
            case "UP":
                parsed.up = true;
                break;
            case "REP":
                parsed.rep = true;
                break;
            case "SHIFT":
                parsed.shift = true;
                break;
            case "CTRL":
                parsed.ctrl = true;
                break;
            case "ALT":
                parsed.alt = true;
                break;
            default:
                if (part === "ANY") {
                    parsed.isAny = true;
                } else {
                    parsed.key = keyNameToKeyCode(part);
                    if (parsed.key === Key.Unknown) {
                        throw new Error(`Invalid keybind part: ${part}`);
                    }
                }

                if (foundKey) {
                    throw new Error(`Duplicate key in keybind: ${part}`);
                }

                foundKey = true;
        }
    }

    // If we haven't found a key and the first part is a modifier, treat it as the keybind instead
    if (!foundKey) {
        if (parts[0] === "SHIFT") {
            parsed.key = keyNameToKeyCode(parts[0]);
            parsed.shift = false;
        } else if (parts[0] === "CTRL") {
            parsed.key = keyNameToKeyCode(parts[0]);
            parsed.ctrl = false;
        } else if (parts[0] === "ALT") {
            parsed.key = keyNameToKeyCode(parts[0]);
            parsed.alt = false;
        }
    }

    return parsed;
}

export class InterfaceMacroSet extends InterfaceElement {
    public macros: Map<string, InterfaceMacro> = new Map();
    private inputContextName: string;

    private static readonly InputContextPrefix = "macroSet_";

    constructor(
        descriptor: MacroSetDescriptor,
        private interfaceManager: any
    ) {
        super(descriptor);
        this.inputContextName = `${InterfaceMacroSet.InputContextPrefix}${this.id}`;

        for (const macro of descriptor.macros) {
            this.AddChild(macro);
        }
    }

    public AddChild(descriptor: MacroDescriptor): void {
        this.macros.set(descriptor.id.value, new InterfaceMacro(
            this.inputContextName,
            descriptor,
            this.interfaceManager
        ));
    }

    public setActive(): void {
        // Set this macro set as the active input context
        //this.interfaceManager.SetActiveMacroSet(this.inputContextName);
    }
}

export class InterfaceMacro extends InterfaceElement {
    private isRepeating: boolean = false;
    private isRelease: boolean = false;
    private isAny: boolean = false;

    constructor(
        contextName: string,
        descriptor: MacroDescriptor,
        private interfaceManager: any
    ) {
        super(descriptor);

        let parsedKeybind: ParsedKeybind;

        try {
            parsedKeybind = parseKeybind(descriptor.name.value);
        } catch (e) {
            console.warn(`Invalid keybind for macro ${this.id}: ${(e as Error).message}`);
            return;
        }

        this.isRepeating = parsedKeybind.rep;
        this.isRelease = parsedKeybind.up;
        this.isAny = parsedKeybind.isAny;

        if (this.isAny && (parsedKeybind.shift || parsedKeybind.ctrl || parsedKeybind.alt || parsedKeybind.rep)) {
            throw new Error("ANY can only be combined with the +UP modifier");
        }

        if (this.isRepeating && this.isRelease) {
            throw new Error("A macro cannot be both +REP and +UP");
        }

        if (this.isAny) {
            // Register for any key press
            this.interfaceManager.RegisterAnyKeyHandler(this.handleAnyKey.bind(this));
            return;
        }

        // Register normal key binding
        this.interfaceManager.RegisterKeyBinding(contextName, this.id, parsedKeybind, {
            onPressed: this.handleMacroPress.bind(this),
            onReleased: this.handleMacroRelease.bind(this)
        });
    }

    get command(): string {
        return (this.descriptor as any).command?.value || "";
    }

    private handleAnyKey(key: Key, keyName: string, keyEventType: "down" | "up"): void {
        if (!this.isAny) {
            return;
        }

        if ((keyEventType !== "up" && this.isRelease) || (keyEventType !== "down" && !this.isRelease)) {
            return;
        }

        if (!this.command) {
            return;
        }

        const command = this.command.replace("[[*]]", keyName);
        this.interfaceManager.RunCommand(command);
    }

    private handleMacroPress(): void {
        if (!this.command) {
            return;
        }

        if (this.isRelease) {
            return;
        }

        this.interfaceManager.RunCommand(this.command, this.isRepeating);
    }

    private handleMacroRelease(): void {
        if (!this.command) {
            return;
        }

        if (this.isRepeating) {
            this.interfaceManager.StopRepeatingCommand(this.command);
        } else if (this.isRelease) {
            this.interfaceManager.RunCommand(this.command);
        }
    }
}
