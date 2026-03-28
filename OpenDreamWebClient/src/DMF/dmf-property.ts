interface IDMFProperty {
    asArg(): string;
    asEscaped(): string;
    asString(): string;
    asParams(): string;
    asJson(): string;
    asJsonDM(): string;
    asRaw(): string;
    asSnowflake(): string;
}

/*
arg
    Value is formatted as if it's an argument on a command line. Numbers are left alone; booleans are 0 or 1; size and position have their X and Y values separated by a space; pretty much everything else is DM-escaped and enclosed in quotes.
escaped
    DM-escape the value as if it's in a quoted string but do not include the quotes. Size and position values both use , to separate their X and Y values.
string
    Value is formatted as a DM-escaped string with surrounding quotes.
params
    Format value for a URL-encoded parameter list (see list2params), escaping characters as needed.
json
    JSON formatting. Numbers are left unchanged; size or position values are turned into objects with x and y items; boolean values are true or false.
json-dm
    JSON formatting, but DM-escaped so it can be included in a quoted string. Quotes are not included.
raw
    Does not change the value's text representation in any way; assumes it's already formatted correctly for the purpose. This is similar to as arg but does no escaping and no quotes.
*/

export class DMFPropertyString implements IDMFProperty {
    value: string;

    constructor(value?: string | null) {
        this.value = value ?? '';
    }

    asArg(): string {
        return '"' + this.asEscaped() + '"';
    }

    asEscaped(): string {
        return this.value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
    }

    asString(): string {
        return this.asArg();
    }

    asParams(): string {
        return encodeURIComponent(this.value);
    }

    asJson(): string {
        return this.asArg();
    }

    asJsonDM(): string {
        const orig = this.value;
        this.value = this.asArg();
        const result = this.asEscaped();
        this.value = orig;
        return result;
    }

    asRaw(): string {
        return this.value;
    }

    asSnowflake(): string {
        return this.asRaw();
    }

    toString(): string {
        return this.asRaw();
    }
}

export class DMFPropertyNum implements IDMFProperty {
    value: number;

    constructor(value: number | string) {
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            if (isNaN(parsed)) {
                // Find last valid digit
                const digits = '0123456789';
                let lastValidPos = -1;
                for (let i = value.length - 1; i >= 0; i--) {
                    if (digits.includes(value[i])) {
                        lastValidPos = i;
                        break;
                    }
                }
                this.value = parseFloat(value.substring(0, lastValidPos + 1));
                console.warn(`Invalid value in DMFPropertyNum '${value}'. Parsed as '${this.value}'.`);
            } else {
                this.value = parsed;
            }
        } else {
            this.value = value;
        }
    }

    asArg(): string {
        return this.asRaw();
    }

    asEscaped(): string {
        return this.asRaw();
    }

    asString(): string {
        return '"' + this.asRaw() + '"';
    }

    asParams(): string {
        return this.asRaw();
    }

    asJson(): string {
        return this.asRaw();
    }

    asJsonDM(): string {
        return this.asRaw();
    }

    asRaw(): string {
        return this.value.toString();
    }

    asSnowflake(): string {
        return this.asRaw();
    }

    toString(): string {
        return this.asRaw();
    }
}

interface Vector2i {
    x: number;
    y: number;
}

export class DMFPropertyVec2 implements IDMFProperty {
    x: number = 0;
    y: number = 0;
    delim: string = ',';

    constructor(x: number|string, y: number|undefined){
        if (typeof x === 'string') {
            if (x.toLowerCase() === 'none') {
                this.x = 0;
                this.y = 0;
                return;
            }
            const parts = x.split(/[,\sx]/);
            this.x = Math.floor(parseFloat(parts[0]));
            this.y = Math.floor(parseFloat(parts[1]));
        } else {
            this.x = x;
            this.y = y!;
        }
    }

    get vector(): Vector2i {
        return { x: this.x, y: this.y };
    }

    asArg(): string {
        return this.x + ' ' + this.y;
    }

    asEscaped(): string {
        return this.x + this.delim + this.y;
    }

    asString(): string {
        return '"' + this.asEscaped() + '"';
    }

    asParams(): string {
        return this.asEscaped();
    }

    asJson(): string {
        return `{"x":${this.x}, "y":${this.y}}`;
    }

    asJsonDM(): string {
        return `{\\"x\\":${this.x}, \\"y\\":${this.y}}`;
    }

    asRaw(): string {
        return this.asEscaped();
    }

    asSnowflake(): string {
        return this.asEscaped();
    }

    toString(): string {
        return this.asRaw();
    }
}

export class DMFPropertySize implements IDMFProperty {
    private _value: DMFPropertyVec2;

    constructor(x: number|string, y: number|undefined){
        this._value = new DMFPropertyVec2(x, y);
        this._value.delim = 'x';
    }

    get x(): number { return this._value.x; }
    set x(value: number) { this._value.x = value; }
    get y(): number { return this._value.y; }
    set y(value: number) { this._value.y = value; }
    get vector(): Vector2i { return this._value.vector; }

    asArg(): string {
        return this._value.asArg();
    }

    asEscaped(): string {
        return this._value.asEscaped();
    }

    asJson(): string {
        return this._value.asJson();
    }

    asJsonDM(): string {
        return this._value.asJsonDM();
    }

    asParams(): string {
        return this._value.asParams();
    }

    asRaw(): string {
        return this._value.asRaw();
    }

    asString(): string {
        return this._value.asString();
    }

    asSnowflake(): string {
        return this._value.asSnowflake();
    }
}

export class DMFPropertyPos implements IDMFProperty {
    private _value: DMFPropertyVec2;

    constructor(x: number, y: number);
    constructor(value: string);
    constructor(value: Vector2i);
    constructor(value: any, y?: number) {
        this._value = new DMFPropertyVec2(value, y);
        this._value.delim = ',';
    }

    get x(): number { return this._value.x; }
    get y(): number { return this._value.y; }
    get vector(): Vector2i { return this._value.vector; }

    asArg(): string {
        return this._value.asArg();
    }

    asEscaped(): string {
        return this._value.asEscaped();
    }

    asJson(): string {
        return this._value.asJson();
    }

    asJsonDM(): string {
        return this._value.asJsonDM();
    }

    asParams(): string {
        return this._value.asParams();
    }

    asRaw(): string {
        return this._value.asRaw();
    }

    asString(): string {
        return this._value.asString();
    }

    asSnowflake(): string {
        return this._value.asSnowflake();
    }
}

export class DMFPropertyColor implements IDMFProperty {
    value: string; // css color string

    constructor(value: string|null|undefined){
        if (value == undefined || value === null ||value.toLowerCase() === 'none') {
            this.value = "#FFFFFF00"; // Transparent
        } else {
            // validate color string
            const s = new Option().style;
            s.color = value;
            if (s.color === '') {
                console.warn(`Invalid color string '${value}' in DMFPropertyColor. Defaulting to transparent.`);
                this.value = "#FFFFFF00";
            } else {
                // Convert to hex format
                const ctx = document.createElement('canvas').getContext('2d')!;
                ctx.fillStyle = value;
                this.value = ctx.fillStyle;
            }
        }
    }

    asArg(): string {
        return this.asString();
    }

    asEscaped(): string {
        return this.asRaw();
    }

    asString(): string {
        return '"' + this.asRaw() + '"';
    }

    asParams(): string {
        return this.asRaw();
    }

    asJson(): string {
        if (this.value=="#FFFFFF00") {
            return '"null"';
        }
        return this.asString();
    }

    asJsonDM(): string {
        if (this.value=="#FFFFFF00") {
            return '"null"';
        }
        return this.asString();
    }

    asRaw(): string {
        if (this.value=="#FFFFFF00") {
            return '';
        }
        return this.value;
    }

    asSnowflake(): string {
        if (this.value=="#FFFFFF00") {
            return 'none';
        }
        return this.value;
    }

    toString(): string {
        return this.asRaw();
    }
}

export class DMFPropertyBool implements IDMFProperty {
    value: boolean;

    constructor(value: boolean | string) {
        if (typeof value === 'string') {
            this.value = value === '1' || value.toLowerCase() === 'true';
        } else {
            this.value = value;
        }
    }

    asArg(): string {
        return this.value ? '1' : '0';
    }

    asEscaped(): string {
        return this.asArg();
    }

    asString(): string {
        return this.value ? '"true"' : '"false"';
    }

    asParams(): string {
        return this.asArg();
    }

    asJson(): string {
        return this.value ? 'true' : 'false';
    }

    asJsonDM(): string {
        return this.value ? 'true' : 'false';
    }

    asRaw(): string {
        return this.value ? '1' : '0';
    }

    asSnowflake(): string {
        return this.value ? 'true' : 'false';
    }

    toString(): string {
        return this.asRaw();
    }

    equals(comparison: string): boolean {
        const comparisonBool = new DMFPropertyBool(comparison);
        return this.value === comparisonBool.value;
    }
}

