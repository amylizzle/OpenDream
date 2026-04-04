import { DMFLexer, Token, TokenType } from './dmf-lexer';
import { DMFWinSet } from './dmf-winset';
import { InterfaceDescriptor } from '../descriptors/interface-descriptor';
import { MacroSetDescriptor } from '../descriptors/macro-descriptor';
import { MenuDescriptor } from '../descriptors/menu-descriptor';
import { WindowDescriptor } from '../descriptors/control-descriptors';



export class DMFParser {
    public Errors: string[] = [];
    private readonly _attributeTokenTypes: TokenType[] = [
        TokenType.Attribute,
        TokenType.Macro,
        TokenType.Menu
    ];
    private _currentToken: Token;
    private _errorMode: boolean = false;
    private readonly _tokenQueue: Token[] = [];

    constructor(private readonly lexer: DMFLexer) {
        this._currentToken = lexer.NextToken();
    }

    /**
     * Parse the command used in a global winset()
     */
    public GlobalWinSet(): DMFWinSet[] {
        const winSets: DMFWinSet[] = [];
        let winset = this.TryGetAttribute();
        while (winset.success) {
            winSets.push(winset.winSet);
            winset = this.TryGetAttribute();
        }

        return winSets;
    }

    public Interface(): InterfaceDescriptor {
        const windowDescriptors: WindowDescriptor[] = [];
        const macroSetDescriptors: MacroSetDescriptor[] = [];
        const menuDescriptors: MenuDescriptor[] = [];

        let parsing = true;
        while (parsing) {
            const windowDescriptor = this.Window();
            if (windowDescriptor) {
                windowDescriptors.push(windowDescriptor);
                this.Newline();
            }

            const macroSet = this.MacroSet();
            if (macroSet) {
                macroSetDescriptors.push(macroSet);
                this.Newline();
            }

            const menu = this.Menu();
            if (menu) {
                menuDescriptors.push(menu);
                this.Newline();
            }

            if (!windowDescriptor && !macroSet && !menu) {
                parsing = false;
            }

            if (this._errorMode) {
                // Error recovery
                let token = this.Current();
                while (token.Type !== TokenType.Window && token.Type !== TokenType.Macro && token.Type !== TokenType.Menu) {
                    token = this.Advance();

                    if (token.Type === TokenType.EndOfFile) {
                        parsing = false;
                        break;
                    }
                }
            }
        }

        this.Consume(TokenType.EndOfFile, "Expected EOF");
        return new InterfaceDescriptor(windowDescriptors, macroSetDescriptors, menuDescriptors);
    }

    private Window(): WindowDescriptor | null {
        if (this.Check(TokenType.Window)) {
            const windowIdToken = this.Current();
            this.Consume(TokenType.Value, "Expected a window id");
            const windowId = windowIdToken.Text;
            this.Newline();

            const window = new WindowDescriptor(windowId);
            while (this.Element(window)) {}

            return window;
        }

        return null;
    }

    private Element(window: WindowDescriptor): boolean {
        if (this.Check(TokenType.Elem)) {
            const elementIdToken = this.Current();
            this.Consume(TokenType.Value, "Expected an element id");
            const elementId = elementIdToken.Text;
            this.Newline();

            const attributes = this.Attributes();
            attributes.set("id", elementId);

            const control = window.CreateChildDescriptor(attributes);
            if (!control) {
                this.Error(`Element '${elementId}' does not have a valid 'type' attribute`);
                return false;
            }

            return true;
        }

        return false;
    }

    private MacroSet(): MacroSetDescriptor | null {
        if (this.Check(TokenType.Macro)) {
            const macroSetIdToken = this.Current();
            this.Consume(TokenType.Value, "Expected a macro set id");
            this.Newline();

            const macroSet = new MacroSetDescriptor(macroSetIdToken.Text);
            while (this.Macro(macroSet)) { }

            return macroSet;
        } else {
            return null;
        }
    }

    private Macro(macroSet: MacroSetDescriptor): boolean {
        if (this.Check(TokenType.Elem)) {
            const macroIdToken = this.Current();
            const hasId = this.Check(TokenType.Value);
            this.Newline();

            const attributes = this.Attributes();

            if (hasId) attributes.set("id", macroIdToken.Text);
            else attributes.set("id", attributes.get("name") || "");

            macroSet.CreateChildDescriptor(attributes);
            return true;
        }

        return false;
    }

    private Menu(): MenuDescriptor | null {
        if (this.Check(TokenType.Menu)) {
            const menuIdToken = this.Current();
            this.Consume(TokenType.Value, `Expected a menu id but got ${menuIdToken.Type} ${menuIdToken.Text}`);
            this.Newline();

            const menu = new MenuDescriptor(menuIdToken.Text);
            while (this.MenuElement(menu)) { }

            return menu;
        }

        return null;
    }

    private MenuElement(menu: MenuDescriptor) : boolean {
        if (this.Check(TokenType.Elem)) {
            const elementIdToken = this.Current();
            const hasId = this.Check(TokenType.Value);
            this.Newline();

            var attributes = this.Attributes();


            if (hasId) attributes.set("id", elementIdToken.Text);
            else attributes.set("id", attributes.get("name") ?? "");
            menu.CreateChildDescriptor(attributes);
            return true;
        }

        return false;
    }

    private Current(): Token {
        return this._currentToken;
    }

    private Advance(): Token {
        this._currentToken = (this._tokenQueue.length > 0) ? this._tokenQueue.shift()! : this.lexer.NextToken();
        while (this._currentToken.Type == TokenType.Error) {
            this.Error(this._currentToken.Text);
            this._currentToken = (this._tokenQueue.length > 0) ? this._tokenQueue.shift()! : this.lexer.NextToken();
        }

        return this.Current();        
    }

    private Check(type: TokenType|TokenType[]): boolean {
        if (Array.isArray(type)) {
            if (!type.includes(this._currentToken.Type)) {
                return false;
            }
        } else if (this._currentToken.Type != type) {
            return false;
        }
        this.Advance();
        return true;
    }

    private Consume(type: TokenType, message: string): void {
        if (this.Check(type)) return;
        this.Error(message);
    }

    private Newline(): void {
        while (this.Check(TokenType.Newline) || this.Check(TokenType.Semicolon)) {}
    }

    private Error(message: string): void {
        this.Errors.push(message);
        this._errorMode = true;
    }

    public Attributes(): Map<string, string> {
        const attributes = new Map<string, string>();
        let winset = this.TryGetAttribute();
        while (winset.success) {
            if (winset.winSet.element !== null) {
                this.Error(`Element id \"${winset.winSet.element}\" is not valid here`);
                winset = this.TryGetAttribute();
                continue;
            } else if (winset.winSet.value == "none") {
                winset = this.TryGetAttribute();
                continue;
            }
            
            attributes.set(winset.winSet.attribute, winset.winSet.value);
            winset = this.TryGetAttribute();
        }
        return attributes;
    }

    private TryGetAttribute(): { success: true; winSet: DMFWinSet } | { success: false; winSet: null } {
        let element: string | null = null;
        let winSet: DMFWinSet | null = null;

        let attributeToken: Token = this.Current();

        if (this.Check(this._attributeTokenTypes)) {
            // Handle element.attribute=value logic
            while (this.Check(TokenType.Period)) {
                element ??= "";
                if (element.length > 0) element += ".";
                element += attributeToken.Text;
                attributeToken = this.Current();

                if (!this.Check(this._attributeTokenTypes)) {
                    this.Error("Expected attribute id");
                    return { success: false, winSet: null };
                }
            }

            if (!this.Check(TokenType.Equals)) {
                // Re-queue tokens (Ew)
                this._tokenQueue.push(this._currentToken);
                this._currentToken = attributeToken;
                console.log(`Requeud token after failed attribute parse: ${this._currentToken.Type}(${this._currentToken.Text})`);
                return { success: false, winSet: null };
            }

            let attributeValue: Token = this.Current();
            let valueText: string = attributeValue.Text;

            if (this.Check(TokenType.Period)) { 
                // Hidden verbs start with a period
                attributeValue = this.Current();
                valueText += attributeValue.Text;
                if (!this.Check(TokenType.Value) && !this.Check(TokenType.Attribute)) {
                    this.Error(`Invalid attribute value (${valueText})`);
                }
            } else if (!this.Check(TokenType.Value)) {
                if (this.Check(TokenType.Semicolon) || this.Check(TokenType.EndOfFile)) {
                    // thing.attribute=; means thing.attribute=empty string
                    valueText = "";
                } else {
                    this.Error(`Invalid attribute value (${valueText})`);
                }
            } else if (this.Check(TokenType.Ternary)) {
                const trueStatements: DMFWinSet[] = [];
                const falseStatements: DMFWinSet[] = [];
                console.log(`Parsing ternary statements for attribute "${attributeToken.Text}" with value "${valueText}"`);
                let result = this.TryGetAttribute();
                console.log(`Ternary parsing result: success=${result.success}, winSet=${result.winSet}`);
                while (result.success) {
                    console.log(`Parsed true statement for ternary on attribute "${attributeToken.Text}": ${result.winSet.attribute} = ${result.winSet.value}`);
                    if (result.winSet) trueStatements.push(result.winSet);
                    result = this.TryGetAttribute();
                }

                if (this.Check(TokenType.Colon)) {
                    result = this.TryGetAttribute();
                    while (result.success) {
                        if (result.winSet) falseStatements.push(result.winSet);
                        result = this.TryGetAttribute();
                    }
                }

                winSet = new DMFWinSet(element, attributeToken.Text, valueText, trueStatements, falseStatements);
                return { success: true, winSet };
            }
            this.Newline();
            winSet = new DMFWinSet(element, attributeToken.Text, valueText);
            return { success: true, winSet };
        }
        console.log(`Current token ${attributeToken.Type}(${attributeToken.Text}) is not a valid attribute token`);
        return { success: false, winSet: null };
    }
}