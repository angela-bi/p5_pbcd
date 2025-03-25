import { commands, params, operators } from './commands'
export type ConstructorNames = "ellipse" | "circle" | "vertex" | "fillPair" | "shapePair"
export type ModifierNames = "fill" | "beginShape"
export type CommandName = ConstructorNames | ModifierNames
export type InsertDirection = "Above" | "Below"

export type Command = {
    name: string
    valid: string[]
    invalid: string[]
    default_valid: Boolean
    direction: InsertDirection | null
    paired_commands?: string[] // can use this in logic
    num_params: number
}

export function checkValidity(hoverCommand: Command, validCommand: Command): InsertDirection | null {
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

export function checkCommands(hoverCommand: Command) {
    return commands.map(command => checkValidity(hoverCommand, command))
}

export function getCommand(functionName: string) {

    for (var c of commands) {
        if (c.name === functionName) {
            return c
        }
    }
    return commands[0] // returns default_command
}