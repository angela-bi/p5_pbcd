import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generate, { GeneratorResult } from "@babel/generator";
import { StateObject } from "../App";
import { checkCommands, checkValidity, Command, getCommand, InsertDirection } from '../utils/check_commands'
import { commands, params, operators } from './commands'
import { generateMutations, literalInsertions } from "./patches";

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
export function is_function(path: NodePath<t.Node>): boolean | null {
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
//Takes #maxFromEach programs from each index category.
export function samplePrograms(newPrograms: newInsertion[], maxFromEach: number): newInsertion[] {
  const sampledPrograms: newInsertion[] = []
  const programsIndicies: any = {}
  const shuffled = newPrograms
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
  shuffled.forEach((insertion) => {
    if (insertion.index in programsIndicies) {
      if (programsIndicies[insertion.index] < maxFromEach) {
        programsIndicies[insertion.index]++
        sampledPrograms.push(insertion)
      }
    } else {
      programsIndicies[insertion.index] = 1
      sampledPrograms.push(insertion)
    }
  })
  return sampledPrograms
}


// given an ast, path representing the function (returned by find_function), and position that user clicked
// returns three arrays of the same structure: [row_1, row_2, ... ] where row_i represents function i. 
// each row_i has n items, where n=number of function i's arguments e.g. if row_i represents ellipse, n=4


// function perturb_params(funcNode:NodePath){


// }


// function perturb_params(ast: parser.ParseResult<t.File>, funcPath: NodePath<t.Node>, curr_pos: Loc) {
//   let addedFunc: string[] = []; // one component per param suggestion
//   let possibleCode: string[] = [];
//   let line: Loc[] = [];

//   for (let i = 0; i < params.length; i++) {
//     const clonedAst = t.cloneNode(ast, true, false);
//     const clonedPath = traverse(clonedAst, {
//       enter(clonedPath) {
//         if (
//           clonedPath.node.loc?.start.index === funcPath.node.start &&
//           clonedPath.node.loc?.end.index === funcPath.node.end &&
//           t.isCallExpression(clonedPath.node)
//         ) {
//           clonedPath.stop();
//           if (t.isCallExpression(clonedPath.node) && t.isIdentifier(clonedPath.node.callee)) {
//             const callee = t.identifier(clonedPath.node.callee.name);

//             let curr_arg: t.Expression | undefined = undefined;
//             const updatedArgs = clonedPath.node.arguments.map((arg, index) => {
//               curr_arg = arg as t.Expression;
//               if (
//                 arg.loc &&
//                 arg.loc.start.index <= curr_pos.start &&
//                 arg.loc.end.index >= curr_pos.end
//               ) {
//                 return t.identifier(params[i]);
//               }
//               return t.isNumericLiteral(arg) ? t.numericLiteral(arg.value) : arg;
//             });

//             const callExpression = t.callExpression(callee, updatedArgs);
//             addedFunc.push(generate(callExpression).code);
//             clonedPath.replaceWith(callExpression);
//             possibleCode.push(generate(clonedAst).code);
//             line.push({ start: curr_pos.start, end: curr_pos.end });

//             for (let j = 0; j < operators.length; j++) {
//               const updatedArgs = clonedPath.node.arguments.map((arg, index) => {
//                 if (
//                   !t.isNumericLiteral(arg)
//                 ) {
//                   return t.binaryExpression(operators[j], t.identifier(params[i]), curr_arg!);
//                 }
//                 return arg
//               });

//               const callExpression = t.callExpression(callee, updatedArgs);
//               addedFunc.push(generate(callExpression).code);
//               clonedPath.replaceWith(callExpression);
//               possibleCode.push(generate(clonedAst).code);
//               line.push({ start: curr_pos.start, end: curr_pos.end });
//             }
//           }
//         }
//       }
//     })
//   };
//   return { addedFunc, possibleCode, line }
// }
//finds a node by its ID
function findNodeByID(newProgram: t.Node, nodeWithID: t.Node): NodePath<t.Node> | undefined {
  let find = undefined
  if (nodeWithID?.extra !== undefined) {
    if ("id" in nodeWithID.extra!) {
      const nodeID = nodeWithID.extra!["id"]
      traverse(newProgram, {
        enter(path) {
          if (path.node.extra?.id === nodeID) {
            find = path
          }
        }
      })
      return find
    }
  }
  return undefined
}

function makeCallExpression(command: Command) {
  const callee = t.identifier(command.name)
  const params = [] as t.Expression[];
  for (let j = 0; j < command.num_params; j++) {
    const numLit = t.numericLiteral(100)
    numLit.extra = { "id": crypto.randomUUID() }
    params.push(numLit)
  }
  const callExpr = t.callExpression(callee, params)
  callExpr.extra = {}
  callExpr.extra['id'] = crypto.randomUUID()
  return callExpr
}

//Given a Call Expression Path, an ast, and a set of possible substitutions, replaces literals with the substitutions. 
//Returns a list of programs
//"All" premutates all the arguments or just some 
function perturbArguments(functionPath: NodePath<t.CallExpression>, ast: parser.ParseResult<t.File>, values: (t.NumericLiteral | t.Identifier | t.Node)[], num_programs: number, all: Boolean = true,): newInsertion[] {
  const newPrograms: newInsertion[] = []
  if (functionPath && "node" in functionPath && "arguments" in functionPath.node) {
    for (var i = 0; i < num_programs; i++) {
      let newAST = t.cloneNode(ast);
      functionPath.node.arguments.forEach((argumentNode) => {
        const substitution = values[Math.floor(Math.random() * values.length)];
        const argumentPath = findNodeByID(newAST, argumentNode)
        if (argumentPath) {
          let [perturbAST, title] = perturbLiteral(argumentPath, newAST, substitution)
          newAST = perturbAST ?? newAST
          if (!all && newAST) {
            const newFuncNode = findNodeByID(newAST, functionPath.node)
            if (newFuncNode) {
              newPrograms.push({ index: "Test", title: generate(newFuncNode.node).code, program: generate(newAST).code })
            }
          }
        }
        if (all && newAST) {
          const newFuncNode = findNodeByID(newAST, functionPath.node)
          if (newFuncNode) {
            newPrograms.push({ index: "Test", title: generate(newFuncNode.node).code, program: generate(newAST).code })
          }
        }
      })
    }

  }
  return newPrograms
}
//Replaces one literal node with the value provided
function perturbLiteral(nodePath: NodePath<t.Node>, ast: parser.ParseResult<t.File>, value: (t.NumericLiteral | t.Identifier | t.Node)): [parser.ParseResult<t.File> | undefined, string?] {
  const patch = (path: NodePath): [NodePath | undefined, string?] => {
    if (path.isNumericLiteral()) {
      // value.extra = {}
      // value.extra["id"] = crypto.randomUUID()
      path.replaceInline(value)
      return [path]
    } else {
      return [undefined]
    }
  }
  let [newProgram, patchTitle] = applyPatch(nodePath, ast, patch)
  return [newProgram, patchTitle]
}

//traverse the expression, applying patches at every applicable level, returns a randomized order
function mutateExpression(topLevelPath: NodePath<t.Node>, ast: parser.ParseResult<t.File>): newInsertion[] {
  let newPrograms: newInsertion[] = []
  console.log("toplevelpath", topLevelPath)
  const mutations = generateMutations(topLevelPath)
  console.log("mutations", mutations)
  mutations.forEach((mutationPatch) => {
    let [newProgram, patchTitle] = applyPatch(topLevelPath, ast, mutationPatch)
    if (newProgram !== undefined) {
      newPrograms.push({ index: "Special", title: patchTitle ?? "", program: generate(newProgram).code })
    }
  })

  topLevelPath.traverse({
    enter(path) {
      console.log("path", path)
      mutations.forEach((mutationPatch) => {
        console.log("patch", mutationPatch)
        let [newProgram, patchTitle] = applyPatch(path, ast, mutationPatch)
        console.log("newprogram", newProgram, patchTitle)
        if (newProgram !== undefined) {
          newPrograms.push({ index: "Special", title: patchTitle ?? "", program: generate(newProgram).code })
        }
      })
    }
  })
  const shuffled = newPrograms
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
  return shuffled
}

//Given a patch, make a new AST, apply the patch, and return the ast
function applyPatch(nodePath: NodePath<t.Node>, ast: parser.ParseResult<t.File>, patch: (path: NodePath) => [NodePath | undefined, string?]): [parser.ParseResult<t.File> | undefined, string?] {
  let clonedAST = t.cloneNode(ast, true, false)
  const dupPath = findNodeByID(clonedAST, nodePath.node)!
  let [replacementNode, title] = patch(dupPath)
  if (replacementNode && replacementNode.parentPath !== null) {
    traverse(clonedAST, {
      enter(path) {
        if (path.node.extra === undefined || path.node.extra['id'] === undefined) {
          path.node.extra = { "id": crypto.randomUUID() }
        }
      }
    })

    dupPath.replaceWith(replacementNode)
    return [clonedAST, title ?? generate(dupPath.node).code]
  }

  return [undefined, undefined]

}
interface newInsertion {
  index: string,
  title: string,
  program: string
}




//Given a Call Expression Path, returns a list of all the valid programs with new commands inserted
function findValidInsertCommands(functionPath: NodePath<t.CallExpression>, ast: parser.ParseResult<t.File>) {
  let newPrograms: newInsertion[] = []
  const callee = (functionPath.node as t.CallExpression).callee
  if (callee.type === "Identifier") {
    const cursorCommand = getCommand(callee.name)
    commands.forEach(insertCommand => {
      let clonedAST = t.cloneNode(ast, true, false)
      const dupNode = findNodeByID(clonedAST, functionPath.node)
      let newNode: any | null = null;
      if (cursorCommand && dupNode) {
        switch (checkValidity(cursorCommand, insertCommand)) {
          case 'Above': {
            newNode = dupNode.insertBefore(makeCallExpression(insertCommand))
            break;
          }
          case 'Below': {
            newNode = dupNode.insertAfter(makeCallExpression(insertCommand))
            break;
          }
        }

        if (newNode !== null) {
          const exprNode = newNode[0].node.expression
          const newCallPath = findNodeByID(clonedAST, exprNode)
          // console.log("newPath", newCallPath)
          if (newCallPath && newCallPath.isCallExpression()) {
            // console.log(literalInsertions(newCallPath))
            perturbArguments(newCallPath, clonedAST, literalInsertions(newCallPath), 10).forEach(
              (program) => {
                // console.log("perturbed", program)
                newPrograms.push({ ...program, index: insertCommand.name })
              })
          }

        }
        // const newCode = generate(clonedAST).code
        // newPrograms.push({ index: insertCommand.name, program: newCode, title: insertCommand.name })
        // console.log(newCode)

      }

    });
    return newPrograms
  }
}
function checkPosition(path: NodePath<t.Node>, cursorPosition: number) {
  if (path.node.start && path.node.end) {
    return path.node.start <= cursorPosition && path.node.end >= cursorPosition
  } else {
    return false
  }

}
// Takes in the current code and position and returns three arrays of the same
// size, each entry in the arrays corresponds to one row of the output, and each
// entry in the row arrays corresponds to a single sketch. The individual
// entries are as follows:
// 1. First array: The whole program (possible code)
// 2. The function to be added
// 3. The line to add the function on
export function perturb(
  code: string,
  currPos: Loc,
): newInsertion[] {
  let newPrograms: newInsertion[] = []
  let ast: parser.ParseResult<t.File>;
  try {
    ast = parser.parse(code);
  } catch (err: any) {
    console.log(
      `%cSyntax error:%c ${err.message}`,
      "color: #CC0000; font-weight: bold",
      "color: #CC0000; font-weight: normal",
    );
    return newPrograms
  }

  const cursorPosition = currPos.start;

  //Add ID's to each node so we can retrieve them later
  traverse(ast, {
    enter(path) {
      path.node.extra = {}
      path.node.extra['id'] = crypto.randomUUID()
    }
  })

  console.log("AST", ast)
  traverse(ast, {
    CallExpression: function (path) {
      if (checkPosition(path, cursorPosition)) {
        const newCommands = findValidInsertCommands(path, ast)!
        // console.log("NewCommands", newCommands)
        newPrograms.push(...newCommands)
      }

    },
    //
    enter(path) {
      if (path.isExpression()) {
        // console.log("Expression", generate(path.node))
        // console.log("Expression", path)
      }
      if (checkPosition(path, cursorPosition)) {
        if (path.isNumericLiteral() || path.isBinaryExpression() || path.isDecimalLiteral()) {
          //check if the parent of this node is not another expression, and if is, reject 
          if (!(path.parentPath.isNumericLiteral() || path.parentPath.isBinaryExpression() || path.parentPath.isDecimalLiteral())) {

            const newExpressions = mutateExpression(path, ast)
            newPrograms.push(...newExpressions)
            console.log("Calling mutate", newExpressions)
          }
          // only stop if we hit a variable declarator, let expression, 
          if (path.parentPath.isVariableDeclarator() || path.parentPath.isCallExpression()) {

          }
        }
      }
    }
  })

  return newPrograms;
}

export function _perturb(
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
    return { possibleCodes, addedFuncs, lines }
  }

  if (currPos) { // user clicks editor
    traverse(ast, {
      enter(path) {
        if (path_contains_pos(path, currPos)) {
          if (is_param(path)) { // user clicks on parameter
            let funcPath = find_function(path)

            // let { addedFunc, possibleCode, line } = perturb_params(ast, funcPath!, currPos)
            // if (addedFunc.length > 0 && possibleCode && line) {
            //   addedFuncs.push(addedFunc)
            //   possibleCodes.push(possibleCode)
            //   lines.push(line)
            // }
          }

          if (path.node.type === 'Identifier' || path.node.type === 'NumericLiteral') { // user clicks on function, or after user clicks parameter
            let funcNode = find_function(path)!.node

            if (
              funcNode &&
              funcNode.type === 'CallExpression' &&
              funcNode.callee.type === 'Identifier'
            ) {
              const func = getCommand(funcNode.callee.name);
              if (func && path.parentPath) {
                const insertDirections = checkCommands(func); // length is the number of functions, length of possibleCode

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
                            line.push({ start: clonedParentPath.node!.loc!.start!.index - 5, end: clonedParentPath.node!.loc!.start!.index - 5 } as Loc)
                          } else if (insertDirections[i] === 'Below' && clonedParentPath) {
                            let add_commands: t.CallExpression[] = [callExpression];
                            if (func.paired_commands && func.paired_commands!.length > 0) {
                              for (let i = 0; i < func.paired_commands.length; i++) {
                                const paired_command = getCommand(func.paired_commands[i])
                                const callee = t.identifier(commands[i].name);
                                const params = [] as t.Expression[];
                                if (paired_command!.num_params > 0) {
                                  for (let k = 0; k < paired_command!.num_params!; k++) {
                                    params.push(t.numericLiteral(100))
                                  }
                                }
                                const callExpression = t.callExpression(callee, params);
                                add_commands.push(callExpression)
                              }
                            }
                            clonedParentPath.insertAfter(add_commands);
                            line.push({ start: clonedParentPath.node!.loc!.end!.index + 5, end: clonedParentPath.node!.loc!.end!.index + 5 } as Loc)
                          }
                          addedFunc.push(generate(callExpression).code)
                        }
                      },
                    });
                    const output = generate(clonedAst, {}, code).code;
                    possibleCode.push(output);
                  }
                  for (let k = 0; k < commands[i].num_params; k++) {
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
                              line.push({ start: clonedParentPath.node!.loc!.start!.index - 5, end: clonedParentPath.node!.loc!.start!.index - 5 } as Loc)
                            } else if (insertDirections[i] === 'Below' && clonedParentPath) {
                              clonedParentPath.insertAfter(callExpression);
                              line.push({ start: clonedParentPath.node!.loc!.end!.index + 5, end: clonedParentPath.node!.loc!.end!.index + 5 } as Loc)
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
