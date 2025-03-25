import * as parser from "@babel/parser";
import traverse, { Binding, NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generate, { GeneratorResult } from "@babel/generator";
import { StateObject } from "../App";
import { checkCommands, checkValidity, Command, getCommand, InsertDirection } from '../utils/check_commands'
import { commands, params, operators } from './commands'
import { generateMutations, literalInsertions } from "./patches";
import { ParseResult } from "@babel/parser";
import { v4 as uuidv4 } from 'uuid';
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
    numLit.extra = { "id": uuidv4() }
    params.push(numLit)
  }
  const callExpr = t.callExpression(callee, params)
  callExpr.extra = {}
  callExpr.extra['id'] = uuidv4()
  return callExpr
}

//Given a Call Expression Path, an ast, and a set of possible substitutions, replaces literals with the substitutions. 
//Returns a list of programs
//"All" premutates all the arguments or just some 
function perturbArguments(functionPath: (NodePath<t.CallExpression>), ast: parser.ParseResult<t.File>, values: (t.NumericLiteral | t.Identifier | t.Node)[], num_programs: number, all: Boolean = true,): newInsertion[] {
  const newPrograms: newInsertion[] = []
  if (functionPath && functionPath.node && functionPath.node.arguments) {
    for (var i = 0; i < num_programs; i++) {
      let newAST = t.cloneNode(ast);
      functionPath.node.arguments.forEach((argumentNode) => {
        const substitution = values[Math.floor(Math.random() * values.length)];
        const argumentPath = findNodeByID(newAST, argumentNode)
        if (argumentPath) {
          let [perturbAST, title] = perturbLiteral(argumentPath, newAST, substitution)
          newAST = perturbAST ?? newAST
          // if (!all && newAST) {
          //   const newFuncNode = findNodeByID(newAST, functionPath.node)
          //   if (newFuncNode) {
          //     newPrograms.push({ index: "Test", title: generate(newFuncNode.node).code, program: generate(newAST).code })
          //   }
          // }
        }

      })
      if (all && newAST !== undefined) {
        const newFuncNode = findNodeByID(newAST, functionPath.node)
        if (newFuncNode && newPrograms.findIndex(x => x.program === generate(newAST).code) === -1) {
          newPrograms.push({ index: "", title: generate(newFuncNode.node).code, program: generate(newAST).code })
        }
      }
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
      path.replaceWith(value)
      return [path]
    } else {
      return [undefined]
    }
  }
  let [newProgram, patchTitle] = applyPatch(nodePath, ast, patch)
  newProgram = newProgram as unknown as ParseResult
  return [newProgram, patchTitle]
}

//traverse the expression, applying patches at every applicable level, returns a randomized order
//partial: just return the expression, not the entire AST. 
function mutateExpression(topLevelPath: NodePath<t.Node>, ast: parser.ParseResult<t.File>, partial?: boolean): newInsertion[] {
  let newPrograms: newInsertion[] = []
  //console.log("toplevelpath", topLevelPath)
  const mutations = generateMutations(topLevelPath)

  let decimal = false

  if (topLevelPath.parentPath && topLevelPath.parentPath.isCallExpression() && topLevelPath.parentPath.node.callee.type === "Identifier") {
    decimal = ["scale", "rotate"].indexOf(topLevelPath.parentPath.node.callee.name) > -1
  }

  const insertionLiterals = literalInsertions(topLevelPath, false, decimal)
  // console.log("mutations", mutations)
  mutations.forEach((mutationPatch) => {
    insertionLiterals.forEach((insertionLiteral) => {
      let [newProgram, patchTitle] = applyPatch(topLevelPath, ast, mutationPatch, insertionLiteral, partial)
      newProgram = newProgram as unknown as ParseResult
      // if (newProgram !== undefined ) {
      //   newPrograms.push({ index: "Special", title: patchTitle ?? "", program: generate(newProgram).code })
      // }
      if (newProgram !== undefined && insertionLiteral.type !== "NumericLiteral") {
        if (partial) {
          newProgram = newProgram as unknown as NodePath<t.Node>
          newPrograms.push({ index: "Special", title: patchTitle ?? "", program: newProgram })
        } else {
          newProgram = newProgram as unknown as ParseResult<t.File>
          newPrograms.push({ index: "Special", title: patchTitle ?? "", program: generate(newProgram).code })
        }
      }
    })
  })

  // console.log("newProgramsMutate", newPrograms)
  topLevelPath.traverse({
    enter(path) {
      // console.log("path", path)

      if (path.isIdentifier() && path.parentPath.isCallExpression() && path.parentPath.node.callee === path.node) {

      } else {
        mutations.forEach((mutationPatch) => {
          insertionLiterals.forEach((insertionLiteral) => {
            let [newProgram, patchTitle] = applyPatch(topLevelPath, ast, mutationPatch, insertionLiteral, partial)

            if (newProgram !== undefined) {
              if (partial) {
                newProgram = newProgram as unknown as NodePath<t.Node>
                newPrograms.push({ index: "Special", title: patchTitle ?? "", program: newProgram })
              } else {
                newProgram = newProgram as unknown as ParseResult<t.File>
                newPrograms.push({ index: "Special", title: patchTitle ?? "", program: generate(newProgram).code })
              }
            }
          })
        })
      }
    }
  })
  // console.log("newProgramsOut", newPrograms)
  const uniqueArray = newPrograms.filter((value, index) => {

    let program = value.program
    if (typeof (value.program) !== 'string') {
      program = program as unknown as NodePath<t.Node>
      program = generate(program.node).code
    }
    const _value = JSON.stringify({ ...value, program: program });
    return index === newPrograms.findIndex(obj => {
      let program = obj.program
      if (typeof (obj.program) !== 'string') {
        program = program as unknown as NodePath<t.Node>
        program = generate(program.node).code
      }
      return JSON.stringify({ ...obj, program: program }) === _value;
    });
  });
  const shuffled = uniqueArray
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)


  return shuffled
}

//Given a patch, make a new AST, apply the patch, and return the ast
function applyPatch(nodePath: NodePath<t.Node>, ast: parser.ParseResult<t.File>, patch: (path: NodePath, literal?: t.Identifier | t.NumericLiteral | t.Expression) => [NodePath | undefined, string?], literal?: t.Identifier | t.NumericLiteral | t.Expression, partial?: boolean): [parser.ParseResult<t.File> | undefined | NodePath<t.Node>, string?] {
  let clonedAST = t.cloneNode(ast, true, false)
  const dupPath = findNodeByID(clonedAST, nodePath.node)!
  let [replacementNode, title] = literal ? patch(dupPath, literal) : patch(dupPath)
  if (replacementNode && replacementNode.parentPath !== null) {
    traverse(clonedAST, {
      enter(path) {
        if (path.node.extra === undefined || path.node.extra['id'] === undefined) {
          path.node.extra = { "id": uuidv4() }
        }
      }
    })

    dupPath.replaceWith(replacementNode)
    if (partial) {
      return [dupPath, title ?? generate(dupPath.node).code]
    } else {
      return [clonedAST, title ?? generate(dupPath.node).code]
    }
  }

  return [undefined, undefined]

}
export interface newInsertion {
  index: string,
  title: string,
  program: string | NodePath<t.Node>
}

//Given a Call Expression Path, returns a list of all the valid programs with new commands inserted
function findValidInsertCommands(functionPath: NodePath<t.CallExpression>, ast: parser.ParseResult<t.File>) {
  let newPrograms: newInsertion[] = []
  const callee = (functionPath.node as t.CallExpression).callee
  if (callee.type === "Identifier") {
    const cursorCommand = getCommand(callee.name)
    //console.log(cursorCommand)
    commands.forEach(insertCommand => {
      let clonedAST = t.cloneNode(ast, true, false)
      const dupNode = findNodeByID(clonedAST, functionPath.node)
      let newNode: any | null = null;
      if (cursorCommand && dupNode) {
        //console.log(checkValidity(cursorCommand, insertCommand), insertCommand);
        switch (checkValidity(cursorCommand, insertCommand)) {
          case 'Above': { // if the insertCommand can be inserted above the cursorCommand
            newNode = dupNode.insertBefore(makeCallExpression(insertCommand))
            break;
          }
          case 'Below': {
            newNode = dupNode.insertAfter(makeCallExpression(insertCommand))
            break;
          }
          case null: {
            break;
          }
          default: {
            break
          }
        }

        if (newNode !== null) {
          let exprNode = null
          if (newNode[0].type === 'ExpressionStatement') {
            exprNode = newNode[0].node.expression // this doesn't exist for non-callExpressions
          } else {
            exprNode = newNode[0].node
          }
          const newCallPath = findNodeByID(clonedAST, exprNode)
          if (newCallPath && newCallPath.isCallExpression()) {
            // console.log(literalInsertions(newCallPath))
            let decimal = false
            if (newCallPath.node.callee.type === "Identifier") {
              decimal = ["scale", "rotate"].indexOf(newCallPath.node.callee.name) > -1
            }
            perturbArguments(newCallPath, clonedAST, literalInsertions(dupNode, true, decimal), 30).forEach(
              (program) => {
                let index = insertCommand.name
                if (["noFill", "noStroke", "erase"].indexOf(index) > -1) {
                  index = "Style Options"
                }
                newPrograms.push({ ...program, index: index })
              })
          }

        }
        // const newCode = generate(clonedAST).code
        // newPrograms.push({ index: insertCommand.name, program: newCode, title: insertCommand.name })
        // console.log(newCode)

      }

    });
    // console.log('newPrograms', newPrograms)
    return newPrograms
  }
}
function isValidMutationExpression(path: NodePath<t.Node>): boolean {
  if (path.parentPath) {

    //If our current path isn't a valid expression, reject
    if (!(path.isNumericLiteral() || path.isBinaryExpression() || path.isDecimalLiteral() || path.isIdentifier())) {
      return false
    }

    if (path.isIdentifier() && path.parentPath.isCallExpression() && path.parentPath.node.callee === path.node) {
      return false
    }

    //If we're in the top of a for loop or while loop, reject
    if (path.parentPath.isWhile() || path.parentPath.isForXStatement() || path.parentPath.isForStatement()) {
      return false
    }


    //check if the parent of this node is not another expression, and if is, reject 
    if ((path.parentPath.isNumericLiteral() || path.parentPath.isBinaryExpression() || path.parentPath.isDecimalLiteral())) {
      return false
    }


    return true
  } else {
    return false
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

// FUNCTION FLOW DIAGRAM

//perturb -> (if callexpression) -> findValidInsertCommands -> (for each valid command to insert) -> perturbArguments -> (for each argument) perturbLiteral -> applyPatch
//        -> (if isValidMutationExpression) -> mutateExpression -> (for each generateMutation, and each child node) applyPatch

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
  // console.log("AST", ast)
  const cursorPosition = currPos.start;

  //Add ID's to each node so we can retrieve them later
  traverse(ast, {
    enter(path) {
      path.node.extra = {}
      path.node.extra['id'] = uuidv4()
    }
  })


  traverse(ast, {
    CallExpression: function (path: NodePath<t.Node>) {
      if (checkPosition(path, cursorPosition) && path.isCallExpression()) {
        const newCommands = findValidInsertCommands(path, ast)!
        //TODO:perturb arguments of current function
        // console.log("NewCommands", newCommands)
        newPrograms.push(...newCommands)

        //Only perturb the inner expressions if we're clicking on the function call, not the inside 
        // console.log(cursorPosition)
        if (path.node.callee.end && cursorPosition < path.node.callee.end) {
          const argumentReplacements: { [key: number]: newInsertion[] } = {}
          path.node.arguments.forEach((arg, index) => {
            const argumentPath = findNodeByID(ast, arg)
            if (argumentPath) {
              const newExpressions = mutateExpression(argumentPath, ast, true)

              if (index in argumentReplacements) {
                argumentReplacements[index].push(...newExpressions)
              } else {
                argumentReplacements[index] = [...newExpressions]
              }
            }
          })
          for (var i = 0; i < 100; i++) {
            let newAST = t.cloneNode(ast);
            let callPath = findNodeByID(newAST, path.node)
            if (callPath && callPath.node.type === "CallExpression") {
              callPath.node.arguments.forEach((arg, index) => {
                // console.log("LOOKING AT ARG", generate(arg).code)
                const argPath = findNodeByID(newAST, arg)
                const newArgs = argumentReplacements[index]
                const newArg = newArgs[Math.floor(Math.random() * newArgs.length)]
                if (newArg) {
                  // console.log("NEWARG", newArg)
                  argPath?.replaceWith((newArg.program as unknown as NodePath<t.Node>))
                }
              })
              const title = "(" + callPath.node.arguments.map(arg => generate(arg).code).join(",") + ")"
              newPrograms.push({ index: "Special", title: title, program: generate(newAST).code })
              // console.log("ADDED ARGS",)
            }
          }
        }

        // console.log("argumentOptions", argumentReplacements)
      }
    },

    // perturbArguments(path, ast, literalInsertions(path, true,decimal), 100).forEach(
    //   (program) => {
    //     newPrograms.push({ ...program, index: insertCommand.name })
    //   })

    //
    enter(path) {
      if (path.isExpression()) {
        // console.log("Expression", generate(path.node))
        // console.log("Expression", path)
      }
      if (checkPosition(path, cursorPosition) && path.parentPath !== null) {
        if (isValidMutationExpression(path)) {
          const newExpressions = mutateExpression(path, ast)
          newPrograms.push(...newExpressions)
          // console.log("Calling mutate", newExpressions)
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
