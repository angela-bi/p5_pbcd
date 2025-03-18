import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generate from "@babel/generator";
import { StateObject } from "../App";
import { checkCommands, createCommand } from '../utils/check_commands'
import {commands, params, operators} from './commands'

export type Loc = {
  start: number,
  end: number
}

// given the position the user clicked, returns true if clicked position is within the current path's start and end position
export function path_contains_pos(path: NodePath<t.Node>, pos: Loc): boolean | null {
  if (path.node.start && path.node.end && pos.start == pos.end && path.node.start <= pos.start && path.node.end >= pos.end || path.node.start && path.node.end && path.node.start >= pos.start && path.node.end <= pos.end) {
    return true
  } else {
    return null
  }
}

// returns true if the path clicked is an argument of a function e.g. 50 or mouseX in ellipse(mouseX,50,50), else false
export function is_param(path: NodePath<t.Node>): boolean {
  return path.listKey === "arguments"
}

// returns true if path is a function e.g. ellipse in ellipse(mouseX,50,50), else false
function is_function(path: NodePath<t.Node>): boolean | null {
  return (t.isCallExpression(path.node) && path.parentPath && t.isExpressionStatement(path.parentPath.node))
}

// given a function path, traverses up the AST until the path is a function; else null
function find_function(path: NodePath<t.Node>): NodePath<t.Node> | null {
  while (path && path.parentPath) {
    if (path && is_function(path)) {
      return path
    }
    path = path.parentPath
  }
  return null
}

// given a path, find all the variables in its scope including global, block
function find_vars_inscope(path: NodePath<t.Node>) {
}

// given an ast, path representing the function (returned by find_function), and position that user clicked
// returns three arrays of the same structure: [row_1, row_2, ... ] where row_i represents function i. 
// each row_i has n items, where n=number of function i's arguments e.g. if row_i represents ellipse, n=4
function perturb_params(ast: parser.ParseResult<t.File>, funcPath: NodePath<t.Node>, curr_pos: Loc) {
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

            for (let j=0; j < operators.length; j++) {
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

// Takes in the current code and position and returns three arrays of the same
// size, each entry in the arrays corresponds to one row of the output, and each
// entry in the row arrays corresponds to a single sketch. The individual
// entries are as follows:
// 1. First array: The whole program (possible code)
// 2. The function to be added
// 3. The line to add the function on
export function _perturb(
    code: string,
    currPos: Loc,
) : {
    possibleCodes: string[][],
    addedFuncs: string[][],
    lines: Loc[][]
} {
  let possibleCodes: string[][] = [];
  let addedFuncs: string[][] = [];
  let lines: Loc[][] = [];

  let ast: parser.ParseResult<t.File>;
  try {
    ast = parser.parse(code);
  } catch (err: any) {
    console.log(
        `%cSyntax error:%c ${err.message}`,
        "color: #CC0000; font-weight: bold",
        "color: #CC0000; font-weight: normal",
    );
    return {possibleCodes, addedFuncs, lines}
  }

  const index = currPos.start;

  console.log(currPos);
  possibleCodes.push(["x = 1"]);
  addedFuncs.push(["xyz"]);
  lines.push([{start: -1, end: -1}])

  return {possibleCodes, addedFuncs, lines};
}

export function perturb(
  code: string,
  currPos: Loc,
) {
  let possibleCodes: string[][] = [];
  let addedFuncs: string[][] = [];
  let lines: Loc[][] = [];

  let ast: parser.ParseResult<t.File>;
  try {
    ast = parser.parse(code);
  } catch (err: any) {
    console.log(
        `%cSyntax error:%c ${err.message}`,
        "color: #CC0000; font-weight: bold",
        "color: #CC0000; font-weight: normal",
    );
    return {possibleCodes, addedFuncs, lines}
  }

  if (currPos) { // user clicks editor
    traverse(ast, {
        enter(path) {
          if (path_contains_pos(path, currPos)) {
            if (is_param(path)) { // user clicks on parameter
              let funcPath = find_function(path)
              
              let { addedFunc, possibleCode, line } = perturb_params(ast, funcPath!, currPos)
              if (addedFunc.length > 0 && possibleCode && line) {
                addedFuncs.push(addedFunc)
                possibleCodes.push(possibleCode)
                lines.push(line)
              }
            }
            
            if (path.node.type === 'Identifier' || path.node.type === 'NumericLiteral') { // user clicks on function, or after user clicks parameter
              let funcNode = find_function(path)!.node

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
  return { possibleCodes, addedFuncs, lines };
}
