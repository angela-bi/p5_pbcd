import React from 'react';
import { StateObject } from '../App';
import * as t from "@babel/types";
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from "@babel/generator";
import { Stack, Button } from '@mui/material';
import { ConstructorNames, ModifierNames, CommandName, InsertDirection, Command, checkValidity, checkCommands, createCommand } from '../logic_copy'

const circle = {name: "circle", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 3} as Command
const ellipse = {name: "ellipse", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 4} as Command // it can have 3 or 4
const fill = {name: "fill", valid: ["circle", "ellipse"], invalid: [], default_valid: false, kind: "Modifier", direction: "Above", num_params: 3} as Command
const beginShape = {name: "beginShape", valid: [], invalid: ["vertex", "beginShape"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 0} as Command // since it's only a hoverCommand
const vertex = {name: "vertex", valid: ["vertex"], invalid: [], default_valid: false, kind: "Constructor", direction: "Below", num_params: 0} as Command

interface SketchProps {
  firstState: StateObject;
  state: StateObject
  code: string;
  startSketch: (state: StateObject, code: string) => StateObject
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void
  stateArray: StateObject[]
}

export const Sketch: React.FC<SketchProps> = ({firstState, state, code, startSketch, updateState, stateArray }) => {
  let commands = [circle, ellipse, fill, beginShape, vertex]
  
  const handleClick = () => { // find out how to log what was clicked
    console.log('handleClick run');
    try {
      updateState(0, "sketchCode", code);
    } catch (e) {
      console.error('couldnt update state', e)
    }
    console.log('state.addedFunction', state.addedFunction)
    let func_ast = parser.parse(state.addedFunction!)
    let added_funcs = [] as string[];
    let possible_code = [] as string[];
    traverse(func_ast, {
      enter(path) {
        const { node } = path;
        let currentPath = path;
        if (path.node.type === 'Identifier') {
          const func_command = createCommand(path.node.name, commands)
          const insertDirections = checkCommands(func_command!, commands);

          for (let i = 0; i < insertDirections.length; i++) {
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
                      params.push(t.numericLiteral(100)) // for now, hard coded
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
                    added_funcs.push(generate(callStatement).code)
                  }
                },
              })
              const output = generate(code_ast, {}, state.sketchCode).code;
              console.log('output, should have '+ commands[i].name + ' added: ', output)
              possible_code.push(output);
            }
          }
          // need logic for changing the first item of the array
          // need command and direction, from previous? can make it a stack? [{addedFunc, insertDirection}]
          console.log('first state sketchcode: ', stateArray[0].sketchCode)
          console.log('what we want to update it to: ', state.sketchCode)
          updateState(0, "sketchCode", state.sketchCode);
          console.log('first state updated')
          
          for (let i = 1; i < stateArray.length; i++) {
            try {
              updateState(i, "addedFunction", added_funcs[i])
              updateState(i, "sketchCode", possible_code[i]);
            } catch (e) {
              console.error("Error parsing the code:", e)
            }
          }
          console.log(stateArray)
        }
      }
    });
  };  

  return (
    <div style={{ height: '300px', width: '300px', padding: 0, margin: 0, border: 'none', position: 'relative' }}>
      <iframe ref={state.iframeRef} style={{ width: '100%', height: '100%', border: 'none', padding: 0, margin: 0}} title={state.addedFunction}/>
      <Button color="inherit" style={{textTransform: 'none'}} onClick={handleClick}>{state.addedFunction}</Button>
    </div>
  );
};
