import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generate from "@babel/generator";
import { StateObject } from "../App";
import { Command, checkCommands, createCommand } from '../utils/check_commands'

const circle = {name: "circle", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 3} as Command
const ellipse = {name: "ellipse", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4} as Command // it can have 3 or 4
const arc = {name: "arc", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 6} as Command
const line = {name: "line", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4} as Command
const quad = {name: "quad", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 12} as Command
const rect = {name: "rect", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4} as Command
const square = {name: "square", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 3} as Command
const triangle = {name: "triangle", valid: [], invalid: ["vertex"], default_valid: true, direction: "Below", num_params: 4} as Command

const fill = {name: "fill", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: false, direction: "Above", num_params: 3} as Command
//const noFill = {name: "noFill", valid: ["fill"], invalid: [], default_valid: false, direction: "Below", paired_commands: [], num_params: 3} as Command

const beginShape = {name: "beginShape", valid: [], invalid: ["vertex", "beginShape"], default_valid: true, direction: "Below", paired_commands: ["vertex", "endShape"], num_params: 0} as Command // since it's only a hoverCommand
const vertex = {name: "vertex", valid: ["beginShape", "vertex"], invalid: [], default_valid: false, direction: "Below", num_params: 2} as Command
const endShape = {name: "endShape", valid: ["vertex"], invalid: [], default_valid: false, direction: "Below", num_params: 0} as Command

const erase = {name: "erase", valid: [], invalid: ["vertex", "erase"], default_valid: true, direction: "Below", paired_commands: ["circle", "noErase"], num_params: 0} as Command // since it's only a hoverCommand
const noErase = {name: "noErase", valid: ["erase"], invalid: [], default_valid: false, direction: "Below", num_params: 0} as Command // since it's only a hoverCommand

const translate = {name: "translate", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: false, direction: "Above", num_params: 2} as Command
const push = {name: "push", valid: ["circle", "ellipse", "arc", "line", "quad", "rect", "triangle"], invalid: [], default_valid: false, direction: "Below", paired_commands: ["translate","pop"], num_params: 0} as Command
const pop = {name: "pop", valid: ["applyMatrix"], invalid: [], default_valid: false, direction: "Below", num_params: 0} as Command

let commands = [circle, ellipse, fill, translate, push, pop, beginShape, vertex, arc, line, rect, endShape, erase, noErase];
const paramSuggestions = [0, 0.1, 10, 100];

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
    traverse(ast, {
        enter(path) {
          const { node } = path;
          let currentPath: NodePath = path;
          //console.log(node.start, node.end, node)
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
                const clonedAst = t.cloneNode(ast, true, false);
                const clonedPath = traverse(clonedAst, {
                  enter(clonedPath) {
                    if (clonedPath.node.loc!.start.index === funcPath.node.start && clonedPath.node.loc!.end.index === funcPath.node.end) {
                      clonedPath.stop(); // stop traversal once the target node is found
                      // replace the argument that was clicked
                      if (clonedPath.node.type === "CallExpression" && clonedPath.node.callee.type === "Identifier") {
                        const callee = t.identifier(clonedPath.node.callee.name);
                        const params = [] as t.Expression[];
                        let index;
                        for (let j = 0; j < clonedPath.node.arguments.length; j++) {
                          // find the clicked argument index; if the start and end
                          if (clonedPath.node.arguments[j].loc!.start!.index <= currPos.start && clonedPath.node.arguments[j].loc!.end!.index >= currPos.end) {
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
                            else if (t.isIdentifier(existingArg)) {params.push(existingArg)}
                          }
                        }
                        const callExpression = t.callExpression(callee, params);
                        addedFunc.push(generate(callExpression).code)
                        clonedPath.replaceWith(callExpression)
                        possibleCode.push(generate(clonedAst).code)
                        line.push({start: currPos.start, end: currPos.end})
                      }
                    }
                  }
                })
              };
              if (addedFunc.length > 0 && possibleCode && line) {
                addedFuncs.push(addedFunc)
                possibleCodes.push(possibleCode)
                lines.push(line)
              }
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
                    if (commands[i].num_params === 0 && insertDirections[i] !== null) { // for functions like beginShape(), fill()
                      const clonedAst = t.cloneNode(ast, true, false);
                      const clonedPath = traverse(clonedAst, {
                        enter(clonedPath) {
                          if (clonedPath.node.loc!.start.index === currentPath.node.start && clonedPath.node.loc!.end.index === currentPath.node.end) {
                            clonedPath.stop(); // Stop traversal once the target node is found
                            const clonedParentPath = clonedPath.parentPath;
    
                            const callee = t.identifier(commands[i].name);
                            const params = [] as t.Expression[];
                            
                            const callExpression = t.callExpression(callee, params);
                            (callExpression as any).extra = { visited: true };
    
                            if (insertDirections[i] === 'Above' && clonedParentPath) {
                              clonedParentPath.insertBefore(callExpression);
                              line.push({start: clonedParentPath.node!.loc!.start!.index - 5, end: clonedParentPath.node!.loc!.start!.index - 5} as Loc)
                            } else if (insertDirections[i] === 'Below' && clonedParentPath) {
                              let add_commands: t.CallExpression[] = [callExpression];
                              console.log(func.paired_commands)
                              if (func.paired_commands && func.paired_commands!.length > 0) {
                                for (let i=0; i < func.paired_commands.length; i++) {
                                  const paired_command = createCommand(func.paired_commands[i], commands)
                                  console.log(func.paired_commands[i], paired_command)
                                  const callee = t.identifier(commands[i].name);
                                  const params = [] as t.Expression[];
                                  if (paired_command!.num_params > 0) {
                                    for (let k  = 0; k < paired_command!.num_params!; k++) {
                                      params.push(t.numericLiteral(100))
                                    }
                                  }
                                  const callExpression = t.callExpression(callee, params);
                                  add_commands.push(callExpression)
                                }
                              }
                              clonedParentPath.insertAfter(add_commands);
                              line.push({start: clonedParentPath.node!.loc!.end!.index + 5, end: clonedParentPath.node!.loc!.end!.index + 5} as Loc)
                            }
                            addedFunc.push(generate(callExpression).code)
                          }
                        },
                      });
                      const output = generate(clonedAst, {}, code).code;
                      possibleCode.push(output);
                    }
                    for (let k  = 0; k < commands[i].num_params; k++) {
                      if (insertDirections[i] !== null) {
                        const clonedAst = t.cloneNode(ast, true, false);
      
                        const clonedPath = traverse(clonedAst, {
                          enter(clonedPath) {
                            if (clonedPath.node.loc!.start.index === currentPath.node.start && clonedPath.node.loc!.end.index === currentPath.node.end) {
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
                              (callExpression as any).extra = { visited: true };
      
                              if (insertDirections[i] === 'Above' && clonedParentPath) {
                                clonedParentPath.insertBefore(callExpression);
                                line.push({start: clonedParentPath.node!.loc!.start!.index - 5, end: clonedParentPath.node!.loc!.start!.index - 5} as Loc)
                              } else if (insertDirections[i] === 'Below' && clonedParentPath) {
                                clonedParentPath.insertAfter(callExpression);
                                line.push({start: clonedParentPath.node!.loc!.end!.index + 5, end: clonedParentPath.node!.loc!.end!.index + 5} as Loc)
                              }
                              
                              addedFunc.push(generate(callExpression).code)
                            }
                          },
                        });

                        const output = generate(clonedAst, {}, code).code;
                        possibleCode.push(output);
                      }
                    }
                    
                    if (addedFunc.length > 0 && possibleCode && line) {
                      addedFuncs.push(addedFunc)
                      possibleCodes.push(possibleCode)
                      lines.push(line)
                    }
                  }
                }
              }
            }
          }
        },
      });
  }
  console.log(possibleCodes)
  return { possibleCodes, addedFuncs, lines };
}