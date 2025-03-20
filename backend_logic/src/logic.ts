export type ConstructorNames = "circle" | "vertex" | "fillPair" | "shapePair"
export type ModifierNames = "fill" | "beginShape"
export type CommandName = ConstructorNames | ModifierNames
export type InsertDirection = "Above" | "Below"

export type Command = {
    name: CommandName
    valid: CommandName[]
    invalid: CommandName[]
    default_valid: Boolean
    kind: "Modifier" | "Constructor" | "ClosingModifier"
    direction: InsertDirection | null
}

export function checkValidity(hoverCommand: Command, validCommand: Command): InsertDirection | null {
    // hoverCommand is what our cursor is on
    // trying to check validity of validCommand
    const VCisValid = validCommand.valid.includes(hoverCommand.name)
    const VCisInValid = validCommand.invalid.includes(hoverCommand.name)

    if (VCisInValid) {
        return null
    } else if (VCisValid) {
        return validCommand.direction
    } else if (validCommand.default_valid) {
        return validCommand.direction
    } else {
        return null
    }
}


export function checkCommands(hoverCommand: Command, commands: Command[]) {
    return commands.map(command => checkValidity(hoverCommand, command))
}