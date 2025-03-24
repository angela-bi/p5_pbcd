import { Command } from "./check_commands"

const circle = { name: "circle", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 3 } as Command
const ellipse = { name: "ellipse", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4 } as Command // it can have 3 or 4
const arc = { name: "arc", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 6 } as Command
const line = { name: "line", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4 } as Command
const quad = { name: "quad", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 12 } as Command
const rect = { name: "rect", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4 } as Command
const square = { name: "square", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 3 } as Command
const triangle = { name: "triangle", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 6 } as Command

const fill = { name: "fill", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: true, direction: "Above", num_params: 3 } as Command
const noFill = { name: "noFill", valid: [], invalid: [], default_valid: true, direction: "Above", paired_commands: [], num_params: 0 } as Command

const stroke = { name: "stroke", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: false, direction: "Above", num_params: 3 } as Command
const noStroke = { name: "noStroke", valid: [], invalid: [], default_valid: true, direction: "Below", paired_commands: [], num_params: 0 } as Command

const beginShape = { name: "beginShape", valid: [], invalid: ["vertex", "beginShape"], default_valid: true, direction: "Below", paired_commands: ["vertex", "endShape"], num_params: 0 } as Command // since it's only a hoverCommand
const vertex = { name: "vertex", valid: ["beginShape", "vertex"], invalid: [], default_valid: false, direction: "Below", num_params: 2 } as Command
const endShape = { name: "endShape", valid: ["vertex"], invalid: [], default_valid: false, direction: "Below", num_params: 0 } as Command

const erase = { name: "erase", valid: [], invalid: ["vertex", "erase"], default_valid: true, direction: "Below", paired_commands: ["circle", "noErase"], num_params: 0 } as Command // since it's only a hoverCommand
const noErase = { name: "noErase", valid: ["erase"], invalid: [], default_valid: false, direction: "Below", num_params: 0 } as Command // since it's only a hoverCommand
const scale = { name: "scale", valid: ["circle", "arc", "ellipse", "line", "quad", "square", "triangle", "rect", ""], invalid: [""], default_valid: true, direction: "Above", num_params: 2 } as Command
const rotate = { name: "rotate", valid: ["circle", "arc", "ellipse", "line", "quad", "square", "triangle", "rect", ""], invalid: [""], default_valid: true, direction: "Above", num_params: 2 } as Command
const translate = { name: "translate", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: true, direction: "Above", num_params: 2 } as Command
const push = { name: "push", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: false, direction: "Below", paired_commands: ["translate", "pop"], num_params: 0 } as Command
const pop = { name: "pop", valid: ["applyMatrix"], invalid: [], default_valid: false, direction: "Below", num_params: 0 } as Command

const default_command = { name: "default", valid: [], invalid: [], default_valid: false, direction: "Below", num_params: 0 } as Command
// used as a stand in for cursorCommand where the clicked command is not defined here

const commands = [default_command, scale, rotate, stroke, noStroke, ellipse, fill, noFill, translate, line, quad, triangle, erase, noErase];
const command_names = commands.map(command => command.name)
const params = ['frameCount', 'mouseX', 'mouseY'];
const operators = ["*", "+"] as ("*" | "+" | "-" | "/" | "%" | "&" | "|" | ">>" | ">>>" | "<<" | "^" | "==" | "===" | "!=" | "!==" | "in" | "instanceof" | ">" | "<" | ">=" | "<=" | "|>")[]

export { commands, command_names, params, operators }