type ConstructorNames = "circle" | "vertex" | "fillPair" | "shapePair"
type ModifierNames = "fill" | "beginShape"
type CommandName = ConstructorNames | ModifierNames
type InsertDirection = "Above" | "Below"

type Command = {
    name: CommandName
	valid: CommandName[]
	invalid: CommandName[]
	default_valid: Boolean
    kind: "Modifier" | "Constructor" | "ClosingModifier"
    direction: InsertDirection | null 
}

function checkValidity( hoverCommand: Command, validCommand: Command): InsertDirection | null {
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

function checkCommands( hoverCommand: Command, commands: Command[]) {
    return commands.map(command => [command.name, checkValidity(hoverCommand, command)])
}

// const command = {name:"", valid: [], invalid: [], default_valid:bool, kind:""} as Command
const circle = {name: "circle", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below"} as Command
const fill = {name: "fill", valid: ["circle"], invalid: [], default_valid: false, kind: "Modifier", direction: "Above"} as Command
const beginShape = {name: "beginShape", valid: ["vertex"], invalid: [], default_valid: false, kind: "Modifier", direction: null} as Command // since it's only a hoverCommand
const vertex = {name: "vertex", valid: ["vertex"], invalid: [], default_valid: false, kind: "Constructor", direction: "Below"} as Command
// vertex is only valid between beginShape and endShape -> default_valid = false

const commands = [circle, fill, beginShape, vertex]
console.log("hover: circle", checkCommands(circle, commands)) // below, above, null, null
console.log("hover: fill", checkCommands(fill, commands)) // below, null, null, null
console.log("hover: vertex", checkCommands(vertex, commands)) // null, null, null, below
