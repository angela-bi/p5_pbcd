import { Command } from "./check_commands"

const circle = { name: "circle", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 3 } as Command
const ellipse = { name: "ellipse", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4 } as Command // it can have 3 or 4
const arc = { name: "arc", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 6 } as Command
const line = { name: "line", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4 } as Command
const quad = { name: "quad", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 12 } as Command
const rect = { name: "rect", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4 } as Command
const square = { name: "square", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 3 } as Command
const triangle = { name: "triangle", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 6 } as Command

const fill = { name: "fill", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: false, direction: "Above", num_params: 3 } as Command
const noFill = { name: "noFill", valid: ["fill"], invalid: [], default_valid: false, direction: "Below", paired_commands: [], num_params: 3 } as Command

const beginShape = { name: "beginShape", valid: [], invalid: ["vertex", "beginShape"], default_valid: true, direction: "Below", paired_commands: ["vertex", "endShape"], num_params: 0 } as Command // since it's only a hoverCommand
const vertex = { name: "vertex", valid: ["beginShape", "vertex"], invalid: [], default_valid: false, direction: "Below", num_params: 2 } as Command
const endShape = { name: "endShape", valid: ["vertex"], invalid: [], default_valid: false, direction: "Below", num_params: 0 } as Command

const erase = { name: "erase", valid: [], invalid: ["vertex", "erase"], default_valid: true, direction: "Below", paired_commands: ["circle", "noErase"], num_params: 0 } as Command // since it's only a hoverCommand
const noErase = { name: "noErase", valid: ["erase"], invalid: [], default_valid: false, direction: "Below", num_params: 0 } as Command // since it's only a hoverCommand

const translate = { name: "translate", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: false, direction: "Above", num_params: 2 } as Command
const push = { name: "push", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: false, direction: "Below", paired_commands: ["translate", "pop"], num_params: 0 } as Command
const pop = { name: "pop", valid: ["applyMatrix"], invalid: [], default_valid: false, direction: "Below", num_params: 0 } as Command

let commands = [circle, ellipse, fill, translate, push, pop, beginShape, vertex, arc, line, rect, quad, square, triangle, endShape, erase, noErase];
const params = ['frameCount', 'mouseX', 'mouseY'];
const operators = ["*", "+"] as ("*" | "+" | "-" | "/" | "%" | "**" | "&" | "|" | ">>" | ">>>" | "<<" | "^" | "==" | "===" | "!=" | "!==" | "in" | "instanceof" | ">" | "<" | ">=" | "<=" | "|>")[]

export { commands, params, operators }