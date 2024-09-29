"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkValidity = checkValidity;
exports.checkCommands = checkCommands;
function checkValidity(hoverCommand, validCommand) {
    // hoverCommand is what our cursor is on
    // trying to check validity of validCommand
    var VCisValid = validCommand.valid.includes(hoverCommand.name);
    var VCisInValid = validCommand.invalid.includes(hoverCommand.name);
    if (validCommand.default_valid == true && VCisInValid || validCommand.default_valid == false && !VCisValid) {
        return null;
    }
    else {
        return validCommand.direction;
    }
}
function checkCommands(hoverCommand, commands) {
    return commands.map(function (command) { return checkValidity(hoverCommand, command); });
}
