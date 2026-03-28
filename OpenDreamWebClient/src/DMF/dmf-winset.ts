export class DMFWinSet {
    constructor(public element: string | null,
                public attribute: string,
                public value:string,
                public trueStatements:DMFWinSet[] | null = null, 
                public falseStatements:DMFWinSet[] | null = null
    ) {}
}
