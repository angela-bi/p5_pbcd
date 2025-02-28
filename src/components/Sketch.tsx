import React, { useEffect, useState } from 'react';
import { StateObject } from '../App';
import * as t from "@babel/types";
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from "@babel/generator";
import { Stack, Button } from '@mui/material';
import { ConstructorNames, ModifierNames, CommandName, InsertDirection, Command, checkValidity, checkCommands, createCommand } from '../utils/check_commands'
import { perturbFunc } from '../utils/perturb';


interface SketchProps {
  state: StateObject;
  code: string;
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void;
  stateArray: StateObject[];
  setNumSketches: React.Dispatch<React.SetStateAction<number[]>>
  setLastInserted: React.Dispatch<React.SetStateAction<number>>
}

export const Sketch: React.FC<SketchProps> = ({state, code, updateState, stateArray, setNumSketches, setLastInserted }) => {
  const [dims, setDims] = useState<string[]>(['320px','320px']);
  
  const handleClick = () => { // find out how to log what was clicked
    console.log('handleClick run');
    try {
      updateState(0, "sketchCode", code);
    } catch (e) {
      console.error('couldnt update state', e)
    }

    const { possibleCodes, addedFuncs } = perturbFunc(code, null, state);
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

  useEffect(() => {
    const handleResizeMessage = (event: MessageEvent) => {
      if (state.iframeRef.current?.contentWindow?.innerHeight && state.iframeRef.current?.contentWindow?.innerWidth) {
        setDims([state.iframeRef.current?.contentWindow?.innerHeight.toString() + 'px',state.iframeRef.current?.contentWindow?.innerWidth.toString() + 'px'])
      }
    };

    window.addEventListener('message', handleResizeMessage);
    return () => window.removeEventListener('message', handleResizeMessage);
  }, []);

  return (
    <div style={{}}>
      {(!state.displayName || state.addedFunction) && 
      <div style={{ display: 'flex', width: 'fit-content', height: 'fit-content', overflow: 'hidden' }}>
        <Stack>
          <iframe 
            ref={state.iframeRef} 
            style={{ width: dims[1], height: dims[0], border: 'none' , resize: 'both', overflow: 'auto'}} 
            title={state.addedFunction} 
          />
          <Button color="inherit" size='small' style={{textTransform: 'none', marginTop: -10}} onClick={handleClick}>{state.addedFunction}</Button>
        </Stack>
      </div>
      }
    </div>
  );
};
