export enum TokenType {
    Error = 'Error',
    EndOfFile = 'EndOfFile',
    Newline = 'Newline',
    Period = 'Period',
    Semicolon = 'Semicolon',
    Equals = 'Equals',
    Value = 'Value',
    Elem = 'Elem',
    Macro = 'Macro',
    Menu = 'Menu',
    Window = 'Window',
    Attribute = 'Attribute',
    Ternary = 'Ternary',
    Colon = 'Colon',
    Lookup = 'Lookup',
}

export class Token {
    public readonly Type: TokenType;
    public readonly Text: string;

    constructor(type: TokenType, text: string) {
        this.Type = type;
        this.Text = text;
    }
};

export class DMFLexer {
    private _currentSourceIndex: number = 0;
    private _parsingAttributeName: boolean = true;



    private get AtEndOfSource(): boolean {
        return this._currentSourceIndex >= this.source.length;
    }

    constructor(private readonly source: string) {}

    private GetCurrent(): string {
        return this.AtEndOfSource ? '\0' : this.source[this._currentSourceIndex];
    }

    private Advance(): string {
        if (!this.AtEndOfSource) {
            this._currentSourceIndex++;
        }
        return this.GetCurrent();
    }

    public NextToken(): Token {
        let c = this.GetCurrent();
        // Skip whitespace characters
        while (c === ' ' || c === '\r' || c === '\t') {
            c = this.Advance();
        }

        switch (c) {
            case '\0':
                return new Token(TokenType.EndOfFile, c);
            case '\n':
                this.Advance();
                this._parsingAttributeName = true;
                return new Token(TokenType.Newline, c);
            case '.':
                this.Advance();
                this._parsingAttributeName = true;
                return new Token(TokenType.Period, c);
            case ';':
                this.Advance();
                this._parsingAttributeName = true;
                return new Token(TokenType.Semicolon, c);
            case '=':
                this.Advance();
                this._parsingAttributeName = false;
                return new Token(TokenType.Equals, c);
            case '\'':
            case '"': {
                const quoteChar = c;
                const textBuilder:string[] = [c];

                while (this.Advance() !== quoteChar && !this.AtEndOfSource) {
                    if (this.GetCurrent() === '\\') {
                        this.Advance();

                        switch (this.GetCurrent()) {
                            case '"':
                            case '\\':
                                textBuilder.push(this.GetCurrent());
                                break;
                            case 't':
                                textBuilder.push('\t');
                                break;
                            case 'n':
                                textBuilder.push('\n');
                                break;
                            default:
                                throw new Error(`Invalid escape sequence '\\${this.GetCurrent()}'`);
                        }
                    } else {
                        textBuilder.push(this.GetCurrent());
                    }
                }

                if (this.GetCurrent() !== quoteChar) {
                    throw new Error(`Expected '${quoteChar}' got '${this.GetCurrent()}'`);
                }
                textBuilder.push(quoteChar);
                this.Advance();

                const text = textBuilder.join('');
                return new Token(TokenType.Value, text.substring(1, text.length - 1));
            }
            case '?': {
                this.Advance();
                console.log(`Parsed ternary operator '?'`);
                return new Token(TokenType.Ternary, c);
            }
            case '[': {
                this.Advance();
                if (this.GetCurrent() !== '[') {
                    throw new Error("Expected '['");
                }

                const textBuilder = ['[['];

                while (this.Advance() !== ']' && !this.AtEndOfSource) {
                    textBuilder.push(this.GetCurrent());
                }

                if (this.GetCurrent() !== ']') {
                    throw new Error("Expected ']'");
                }
                this.Advance();
                textBuilder.push(']]');
                return new Token(TokenType.Lookup, textBuilder.join(''));
            }
            //Intentional fall through - in C# we just did "case ':' when _parsingAttributeName", but in TS we have to do it inside the case block
            case ':': { 
                if (this._parsingAttributeName) {
                    this.Advance();
                    return new Token(TokenType.Colon, c);
                }
            }            
            default: {
                if (!this.isAscii(c)) {
                    this.Advance();
                    return new Token(TokenType.Error, `Invalid character: ${c}`);
                }

                const textBuilder: string[] = [c];

                while (!this.isWhitespace(this.Advance()) &&
                    this.GetCurrent() != ';' && 
                    this.GetCurrent() != '=' &&
                    this.GetCurrent() != '?' &&
                    this.GetCurrent() != ':' &&
                    !(this._parsingAttributeName && this.GetCurrent() == '.') && !this.AtEndOfSource) 
                    {
                        textBuilder.push(this.GetCurrent());
                    }       


                const text = textBuilder.join('');
                let tokenType: TokenType;

                if (this._parsingAttributeName) {
                    switch (text) {
                        case 'elem':
                            tokenType = TokenType.Elem;
                            break;
                        case 'macro':
                            tokenType = TokenType.Macro;
                            break;
                        case 'menu':
                            tokenType = TokenType.Menu;
                            break;
                        case 'window':
                            tokenType = TokenType.Window;
                            break;
                        default:
                            tokenType = TokenType.Attribute;
                            break;
                    }
                    this._parsingAttributeName = false;
                } else {
                    tokenType = TokenType.Value;
                    console.log(`Parsed value token: ${text}`);
                    this._parsingAttributeName = true;
                }

                return new Token(tokenType, text);
            }
        }
    }

    private isWhitespace(char: string): boolean {
        return char === ' ' || char === '\t' || char === '\r' || char === '\n';
    }

    private isAscii(char: string): boolean {
        return char.charCodeAt(0) <= 127;
    }
}
