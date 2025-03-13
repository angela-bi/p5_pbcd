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
const params = ['frameCount', 'mouseX', 'mouseY'];
const operators = ["*", "+"] as ("*" | "+" | "-" | "/" | "%" | "**" | "&" | "|" | ">>" | ">>>" | "<<" | "^" | "==" | "===" | "!=" | "!==" | "in" | "instanceof" | ">" | "<" | ">=" | "<=" | "|>")[]

export type Loc = {
  start: number,
  end: number
}

function path_contains_pos(path: NodePath<t.Node>, pos: Loc) {
  return (path.node.start && path.node.end && pos.start == pos.end && path.node.start <= pos.start && path.node.end >= pos.end) // if user clicks a single position
  || (path.node.start && path.node.end && path.node.start >= pos.start && path.node.end <= pos.end) // if after function is added from clicking on sketch
}

function is_param(path: NodePath<t.Node>) {
  // returns true if the path clicked is an argument of a function
  return path.listKey === "arguments"
}

function is_function(path: NodePath<t.Node>) {
  return (t.isCallExpression(path.node) && path.parentPath && t.isExpressionStatement(path.parentPath.node))
}

function find_function(path: NodePath<t.Node>) {
  // given a function argument node, traverses up the AST 

  while (path && path.parentPath) {
    if (path && is_function(path)) {
      return path
    }
    path = path.parentPath
  }
  return null
}

function find_vars_inscope(path: NodePath<t.Node>) {
  // given a path, find all the variables in its scope
  // should find global variables, 
}

function suggest_params(arg: t.ArgumentPlaceholder | t.SpreadElement | t.Expression) {
  let output = []
  for (let i=0; i < params.length; i++) {
    output.push(t.identifier(params[i]))
    for (let j=0; j < operators.length; j++) {
      if (t.isNumericLiteral(arg)) {
        output.push(t.binaryExpression(operators[j], t.identifier(params[i]), t.numericLiteral(arg.value)))
      } else if (t.isIdentifier(arg)) {
        output.push(t.binaryExpression(operators[j], t.identifier(params[i]), arg))
      }
    }
  }
}

function perturb_params(ast: parser.ParseResult<t.File>, funcPath: NodePath<t.Node>, curr_pos: Loc) {
  // returns three arrays of suggestions given a path representing the function
  let addedFunc: string[] = []; // one component per param suggestion
  let possibleCode: string[] = [];
  let line: Loc[] = [];

  for (let i=0; i < params.length; i++) {
    const clonedAst = t.cloneNode(ast, true, false);
    const clonedPath = traverse(clonedAst, {
      enter(clonedPath) {
        if (
          clonedPath.node.loc?.start.index === funcPath.node.start &&
          clonedPath.node.loc?.end.index === funcPath.node.end && 
          t.isCallExpression(clonedPath.node)
        ) {
          clonedPath.stop(); 
          console.log(clonedPath)
          if (t.isCallExpression(clonedPath.node) && t.isIdentifier(clonedPath.node.callee)) {
            const callee = t.identifier(clonedPath.node.callee.name);
      
            let curr_arg : t.Expression | undefined = undefined;
            const updatedArgs = clonedPath.node.arguments.map((arg, index) => {
              curr_arg = arg as t.Expression;
              if (
                arg.loc &&
                arg.loc.start.index <= curr_pos.start &&
                arg.loc.end.index >= curr_pos.end
              ) {
                return t.identifier(params[i]);
              }
              return t.isNumericLiteral(arg) ? t.numericLiteral(arg.value) : arg;
            });
      
            const callExpression = t.callExpression(callee, updatedArgs);
            addedFunc.push(generate(callExpression).code);
            clonedPath.replaceWith(callExpression);
            possibleCode.push(generate(clonedAst).code);
            line.push({ start: curr_pos.start, end: curr_pos.end });

            for (let j=0; j<operators.length; j++) {
              const updatedArgs = clonedPath.node.arguments.map((arg, index) => {
                if (
                  !t.isNumericLiteral(arg)
                ) {
                  return t.binaryExpression(operators[j], t.identifier(params[i]), curr_arg!);
                }
                return arg
              });

              const callExpression = t.callExpression(callee, updatedArgs);
              addedFunc.push(generate(callExpression).code);
              clonedPath.replaceWith(callExpression);
              possibleCode.push(generate(clonedAst).code);
              line.push({ start: curr_pos.start, end: curr_pos.end });
            }
          }
        }
      }      
    })
  };
  return { addedFunc, possibleCode, line}
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
    console.log(currPos)
    traverse(ast, {
        enter(path) {
          if (path_contains_pos(path, currPos)) {
            if (is_param(path)) { // user clicks on parameter
              let funcPath = find_function(path)
              console.log(funcPath!.node)
              
              let { addedFunc, possibleCode, line } = perturb_params(ast, funcPath!, currPos)
              console.log(addedFunc, possibleCode, line)
              if (addedFunc.length > 0 && possibleCode && line) {
                addedFuncs.push(addedFunc)
                possibleCodes.push(possibleCode)
                lines.push(line)
              }
            }
            let funcPath = find_function(path)
            if (path.node.type === 'Identifier' || path.node.type === 'NumericLiteral') { // user clicks on function, or after user clicks parameter
              while (path.parentPath && path.parentPath.node.type !== 'CallExpression') {
                path = path.parentPath;
              }
    
              const funcNode = path.parentPath?.node;
              if (
                funcNode &&
                funcNode.type === 'CallExpression' &&
                funcNode.callee.type === 'Identifier'
              ) {
                const func = createCommand(funcNode.callee.name, commands);
                if (func && path.parentPath) {
                  const insertDirections = checkCommands(func, commands); // length is the number of functions, length of possibleCode
    
                  for (let i = 0; i < insertDirections.length; i++) {
                    let addedFunc: string[] = [];
                    let possibleCode: string[] = [];
                    let line: Loc[] = [];
                    if (commands[i].num_params === 0 && insertDirections[i] !== null) { // for functions like beginShape(), fill()
                      const clonedAst = t.cloneNode(ast, true, false);
                      const clonedPath = traverse(clonedAst, {
                        enter(clonedPath) {
                          if (clonedPath.node.loc!.start.index === path.node.start && clonedPath.node.loc!.end.index === path.node.end) {
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
                            if (clonedPath.node.loc!.start.index === path.node.start && clonedPath.node.loc!.end.index === path.node.end) {
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