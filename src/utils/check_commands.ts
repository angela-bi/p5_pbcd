export type ConstructorNames = "ellipse" | "circle" | "vertex" | "fillPair" | "shapePair"
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
    num_params: number
}

export function checkValidity( hoverCommand: Command, validCommand: Command): InsertDirection | null {
    // hoverCommand is what our cursor is on
    // trying to check validity of validCommand
    const VCisValid = validCommand.valid.includes(hoverCommand.name)
    const VCisInValid = validCommand.invalid.includes(hoverCommand.name)

    if (validCommand.default_valid == true && VCisInValid || validCommand.default_valid == false && !VCisValid) {
        return null
    } else {
        return validCommand.direction
    }
}

export function checkCommands( hoverCommand: Command, commands: Command[]) {
    return commands.map(command => checkValidity(hoverCommand, command))
}

export function createCommand(functionName: string, commands: Command[]) {
    for (var c of commands) {
      if (c.name == functionName) {
        return c
      }
    }
  }