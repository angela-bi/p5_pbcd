import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generate from "@babel/generator";
import { StateObject } from "../App";
import { ConstructorNames, ModifierNames, CommandName, InsertDirection, Command, checkValidity, checkCommands, createCommand } from '../utils/check_commands'

const circle = {name: "circle", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 3} as Command
const ellipse = {name: "ellipse", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 4} as Command // it can have 3 or 4
const fill = {name: "fill", valid: ["circle", "ellipse"], invalid: [], default_valid: false, kind: "Modifier", direction: "Above", num_params: 3} as Command
const beginShape = {name: "beginShape", valid: [], invalid: ["vertex", "beginShape"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 0} as Command // since it's only a hoverCommand
const vertex = {name: "vertex", valid: ["vertex"], invalid: [], default_valid: false, kind: "Constructor", direction: "Below", num_params: 0} as Command

let commands = [circle, ellipse, fill, beginShape, vertex];
const paramSuggestions = [-100, -10, -0.1, 0, 0.1, 10, 100];

export type Loc = {
  start: number,
  end: number
}

export function perturb(
  code: string,
  currPos: Loc,
  state: StateObject | undefined
) {
  let possibleCodes: string[][] = [];
  let addedFuncs: string[][] = [];
  let lines: Loc[][] = [];
  let ast = parser.parse(code);

  if (currPos) { // user clicks editor
    console.log('currPos: ', currPos)
    traverse(ast, {
        enter(path) {
          const { node } = path;
          let currentPath: NodePath = path;
          if ((node.start && node.end && currPos.start == currPos.end && node.start <= currPos.start && node.end >= currPos.end) || (node.start && node.end && node.start >= currPos.start && node.end <= currPos.end) ) {
            if (path.node.type === 'NumericLiteral') { // user clicks on parameter
              while (currentPath.parentPath && currentPath.parentPath.node.type !== 'CallExpression') {
                currentPath = currentPath.parentPath;
              } 
              const funcPath = currentPath.parentPath! // this is the path containing the function with its arguments;
              
              let addedFunc: string[] = []; // one component per param suggestion
              let possibleCode: string[] = [];
              let line: Loc[] = [];
              // one row with multiple components
              for (let i=0; i < paramSuggestions.length; i++) {
                const clonedAst = JSON.parse(JSON.stringify(ast));
                const clonedPath = traverse(clonedAst, {
                  enter(clonedPath) {
                    if (clonedPath.node.start === funcPath.node.start && clonedPath.node.end === funcPath.node.end) {
                      clonedPath.stop(); // stop traversal once the target node is found
                      // replace the argument that was clicked
                      if (clonedPath.node.type === "CallExpression" && clonedPath.node.callee.type === "Identifier") {
                        const callee = t.identifier(clonedPath.node.callee.name);
                        const params = [] as t.Expression[];
                        let index;
                        for (let j = 0; j < clonedPath.node.arguments.length; j++) {
                          // find the clicked argument index; if the start and end
                          if (clonedPath.node.arguments[j].start! <= currPos.start && clonedPath.node.arguments[j].end! >= currPos.end) {
                            index = j
                          }
                        }
                        for (let j = 0; j < clonedPath.node.arguments.length; j++) {
                          // find the clicked argument index; if the start and end
                          if (j == index) { 
                            params.push(t.numericLiteral(paramSuggestions[i]))
                          } else {
                            const existingArg = clonedPath.node.arguments[j];
                            if (t.isNumericLiteral(existingArg)) {params.push(t.numericLiteral(existingArg.value))} // 100 should be replaced with the existing param
                          }
                        }
                        const callExpression = t.callExpression(callee, params);
                        addedFunc.push(generate(callExpression).code)
                        clonedPath.replaceWith(callExpression)
                        possibleCode.push(generate(clonedAst).code)
                        line.push({start: node.start!, end: node.end!})
                      }
                    }
                  }
                })
              };
              addedFuncs.push(addedFunc)
              possibleCodes.push(possibleCode)
              lines.push(line)
            } 
            if (path.node.type === 'Identifier' || path.node.type === 'NumericLiteral') { // user clicks on function, or after user clicks parameter
              while (currentPath.parentPath && currentPath.parentPath.node.type !== 'CallExpression') {
                currentPath = currentPath.parentPath;
              }
    
              const funcNode = currentPath.parentPath?.node;
              if (
                funcNode &&
                funcNode.type === 'CallExpression' &&
                funcNode.callee.type === 'Identifier'
              ) {
                const func = createCommand(funcNode.callee.name, commands);
                if (func && currentPath.parentPath) {
                  const insertDirections = checkCommands(func, commands); // length is the number of functions, length of possibleCode
    
                  for (let i = 0; i < insertDirections.length; i++) {
                    let addedFunc: string[] = [];
                    let possibleCode: string[] = [];
                    let line: Loc[] = [];
                    for (let k  = 0; k < commands[i].num_params; k++) {
                      if (insertDirections[i] !== null) {
                        const clonedAst = JSON.parse(JSON.stringify(ast));
      
                        const clonedPath = traverse(clonedAst, {
                          enter(clonedPath) {
                            if (clonedPath.node.start === currentPath.node.start &&
                                clonedPath.node.end === currentPath.node.end) {
                              clonedPath.stop(); // Stop traversal once the target node is found
                              const clonedParentPath = clonedPath.parentPath;
      
                              const callee = t.identifier(commands[i].name);
                              const params = [] as t.Expression[];
                              for (let j = 0; j < commands[i].num_params; j++) {
                                if (j == k) {
                                  params.push(t.identifier('mouseX')) // hard coded
                                } else {
                                  params.push(t.numericLiteral(100)) // 100 should be replaced with the existing param
                                }
                              }
                              const callExpression = t.callExpression(callee, params);
                              callExpression.loc = clonedParentPath!.node.loc;
      
                              if (insertDirections[i] === 'Above' && clonedParentPath) {
                                clonedParentPath.insertBefore(callExpression);
                              } else if (insertDirections[i] === 'Below' && clonedParentPath) {
                                clonedParentPath.insertAfter(callExpression);
                              }
                              line.push({start: callExpression.loc!.start!.index, end: callExpression.loc!.end!.index} as Loc)
                              addedFunc.push(generate(callExpression).code)
                            }
                          },
                        });
                        const output = generate(clonedAst, {}, code).code;
                        possibleCode.push(output);
                      }
                    }
                    addedFuncs.push(addedFunc)
                    possibleCodes.push(possibleCode)
                    lines.push(line)
                  }
                }
              }
            }
          }
        },
      });
  }
  return { possibleCodes, addedFuncs, lines };
}