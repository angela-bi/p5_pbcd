import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generate from "@babel/generator";
import { createCommand, checkCommands, Command } from "./check_commands";
import { StateObject } from "../App";

export function perturbFunc(
  code: string,
  currPos: number | null,
  commands: Command[],
  state: StateObject | undefined
) {
  let possibleCodes: string[][] = [];
  let addedFuncs: string[][] = [];
  let ast = parser.parse(code);

  if (currPos) {
    traverse(ast, {
        enter(path) {
          const { node } = path;
          let currentPath: NodePath = path;

          if (node.start && node.end && node.start <= currPos && node.end >= currPos) {
            if (path.node.type === 'NumericLiteral' || path.node.type === 'Identifier') {
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
      
                              if (insertDirections[i] === 'Above' && clonedParentPath) {
                                clonedParentPath.insertBefore(callExpression);
                              } else if (insertDirections[i] === 'Below' && clonedParentPath) {
                                clonedParentPath.insertAfter(callExpression);
                              }
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
                  }
                }
              }
            }
          }
        },
      });
  } else if (state) {
    ast = parser.parse(state.addedFunction!)
    traverse(ast, {
        enter(path) {
          if (path.node.type === 'Identifier') { // this is the function
            const func_command = createCommand(path.node.name, commands)
            const insertDirections = checkCommands(func_command!, commands);
  
            for (let i = 0; i < insertDirections.length; i++) {
                let addedFunc: string[] = [];
                let possibleCode: string[] = [];
                for (let k  = 0; k < commands[i].num_params; k++) {
                    if (insertDirections[i] !== null) {
                        const code_ast = parser.parse(state.sketchCode);
                        const clonedPath = traverse(code_ast, {
                            enter(clonedPath) {
                            // have logic about finding where the code just inserted is
                            if (clonedPath.node.type === 'Identifier' && path.node.type === 'Identifier' && clonedPath.node.name === path.node.name) {
                                clonedPath.stop()
            
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
                                const callStatement = t.expressionStatement(callExpression);
            
                                let blockPath = clonedPath.findParent((p) => p.isBlockStatement());
                                if (blockPath && blockPath.isBlockStatement()) {
                                    if (insertDirections[i] === "Above") {
                                        blockPath.unshiftContainer("body", callStatement);
                                    } else if (insertDirections[i] === "Below") {
                                        blockPath.pushContainer("body", callStatement);
                                    }
                                }
                                addedFunc.push(generate(callStatement).code)
                            }
                            },
                        })
                        const output = generate(code_ast, {}, state.sketchCode).code;
                        possibleCode.push(output);
                    }
                }
                addedFuncs.push(addedFunc)
                possibleCodes.push(possibleCode)
            }
            // need logic for changing the first item of the array
            // need command and direction, from previous? can make it a stack? [{addedFunc, insertDirection}]
            path.stop()
          }
        }
      });
  }
  return { possibleCodes, addedFuncs };
}

export function perturbParam(editorCode: string, curr_pos: number) {
  let output = '';
  const ast = parser.parse(editorCode);
    
  traverse(ast, {
    enter(path) {
      const {node} = path;
      let currentPath = path
      // locate node that is clicked
      if (node.start && node.end && node.start <= curr_pos && node.end >= curr_pos) {
        if (path.node.type == 'NumericLiteral' || path.node.type == 'Identifier') {
          while (currentPath.parentPath && currentPath.parentPath.type !== 'CallExpression') {
            currentPath = currentPath.parentPath;
          }
          currentPath = currentPath.parentPath!;
          if ( t.isCallExpression(currentPath.node) && currentPath.node.arguments.every((node) => t.isNode(node))) {
  
            let newArgs = currentPath.node.arguments.map(() =>
              t.identifier('mouseX') // hard coded, replace later
            );
  
            currentPath.replaceWith(
              t.callExpression(currentPath.node.callee, newArgs)
            );
          }
        }
      }
    },
  });

  output = generate(ast, {}, editorCode).code;
  return output
}
