import React from 'react';
import { StateObject } from '../App';
import * as t from "@babel/types";
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from "@babel/generator";
import { Stack, Button } from '@mui/material';
import { ConstructorNames, ModifierNames, CommandName, InsertDirection, Command, checkValidity, checkCommands, createCommand } from '../utils/check_commands'
import { perturbFunc } from '../utils/perturb';

const circle = {name: "circle", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 3} as Command
const ellipse = {name: "ellipse", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 4} as Command // it can have 3 or 4
const fill = {name: "fill", valid: ["circle", "ellipse"], invalid: [], default_valid: false, kind: "Modifier", direction: "Above", num_params: 3} as Command
const beginShape = {name: "beginShape", valid: [], invalid: ["vertex", "beginShape"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 0} as Command // since it's only a hoverCommand
const vertex = {name: "vertex", valid: ["vertex"], invalid: [], default_valid: false, kind: "Constructor", direction: "Below", num_params: 0} as Command

interface SketchProps {
  state: StateObject;
  code: string;
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void;
  stateArray: StateObject[];
  setNumSketches: React.Dispatch<React.SetStateAction<number[]>>
}

export const Sketch: React.FC<SketchProps> = ({state, code, updateState, stateArray, setNumSketches }) => {
  let commands = [circle, ellipse, fill, beginShape, vertex]
  
  const handleClick = () => { // find out how to log what was clicked
    console.log('handleClick run');
    try {
      updateState(0, "sketchCode", code);
    } catch (e) {
      console.error('couldnt update state', e)
    }

    const { possibleCodes, addedFuncs } = perturbFunc(code, null, commands, state);
    const numSketches = addedFuncs.map((x) => x.length);
    setNumSketches(numSketches);

    let counter = 0
    for (let i = 0; i < possibleCodes.length; i++) {
      for (let j = 0; j < possibleCodes[i].length; j++) {
        updateState(counter+1, "sketchCode", possibleCodes[i][j])
        updateState(counter+1, "addedFunction", addedFuncs[i][j])
        counter += 1
      }
    }
  };  

  return (
    <div style={{height:'340px', overflow: 'clip'}}>
      {(state.isMain || state.addedFunction) && 
      <div style={{ display: 'flex', width: 'fit-content', height: 'fit-content', overflow: 'hidden' }}>
        <Stack>
          <iframe 
            ref={state.iframeRef} 
            style={{ width: '320px', height: '320px', border: 'none' }} 
            title={state.addedFunction} 
          />
          <Button color="inherit" size='small' style={{textTransform: 'none', marginTop: -10}} onClick={handleClick}>{state.addedFunction}</Button>
        </Stack>
      </div>
      }
    </div>
  );
};
