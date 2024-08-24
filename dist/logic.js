"use strict";
// to run, in p5_pbcd run "tsc"
// then run "node dist/logic.js"
// we return null when there is no valid direction that validCommand can be inserted in
// we also return null in cases such as hover:vertex valid:endShape because we assume that the user uses paired commands properly
// essentially, null = "it doesn't make sense to offer this validCommand as an option to the user"
function checkValidity(hoverCommand, validCommand) {
    // hoverCommand is what our cursor is on
    // trying to check validity of validCommand
    const VCisValid = validCommand.valid.includes(hoverCommand.name);
    const VCisInValid = validCommand.invalid.includes(hoverCommand.name);
    if (validCommand.default_valid == true && VCisInValid || validCommand.default_valid == false && !VCisValid) {
        return null;
    }
    else {
        return validCommand.direction;
    }
}
function checkCommands(hoverCommand, commands) {
    return commands.map(command => [command.name, checkValidity(hoverCommand, command)]);
}
// const command = {name:"", valid: [], invalid: [], default_valid:bool, kind:""} as Command
const circle = { name: "circle", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below" };
const fill = { name: "fill", valid: ["circle"], invalid: [], default_valid: false, kind: "Modifier", direction: "Above" };
const beginShape = { name: "beginShape", valid: ["vertex"], invalid: [], default_valid: false, kind: "Modifier", direction: null }; // since it's only a hoverCommand
const vertex = { name: "vertex", valid: ["vertex"], invalid: [], default_valid: false, kind: "Constructor", direction: "Below" };
// vertex is only valid between beginShape and endShape -> default_valid = false
const commands = [circle, fill, beginShape, vertex];
console.log("hover: circle", checkCommands(circle, commands)); // below, above, null, null
console.log("hover: fill", checkCommands(fill, commands)); // below, null, null, null
console.log("hover: vertex", checkCommands(vertex, commands)); // null, null, below, below
// scratch work
// if (validCommand.kind == "ClosingModifier") {
//     return null // change this to if hoverCommand is a valid "body" command and valid parentheses
// }
// if (validCommand.kind == "Modifier") {
//     if (isOnValidList || validCommand.default_valid) { return "Above" } // both modifiers and constructors can be default true or false
//     return "Below" // there are edge cases where constructor can go below modifier
// }
// if (isOnInvalidList || !validCommand.default_valid) {
//     return null // invalid
// } 
// return null
