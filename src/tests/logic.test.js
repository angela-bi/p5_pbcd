"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logic_js_1 = require("../src/logic.js");
// const command = {name:"", valid: [], invalid: [], default_valid:bool, kind:""} as Command
const circle = { name: "circle", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below" };
const fill = { name: "fill", valid: ["circle"], invalid: [], default_valid: false, kind: "Modifier", direction: "Above" };
const beginShape = { name: "beginShape", valid: [], invalid: ["vertex", "beginShape"], default_valid: true, kind: "Constructor", direction: "Below" }; // since it's only a hoverCommand
const vertex = { name: "vertex", valid: ["vertex"], invalid: [], default_valid: false, kind: "Constructor", direction: "Below" };
// vertex is only valid between beginShape and endShape -> default_valid = false
const commands = [circle, fill, beginShape, vertex];
describe('testing logic.ts', () => {
    test('hover: circle', () => {
        expect((0, logic_js_1.checkCommands)(circle, commands)).toStrictEqual(['Below', 'Above', 'Below', null]);
    });
    test('hover: fill', () => {
        expect((0, logic_js_1.checkCommands)(fill, commands)).toStrictEqual(['Below', null, 'Below', null]);
    });
    test('hover: vertex', () => {
        expect((0, logic_js_1.checkCommands)(vertex, commands)).toStrictEqual([null, null, null, 'Below']);
    });
});
