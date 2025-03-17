import React, { useEffect, useRef, useState } from 'react';
import { StateObject } from '../App';
import * as t from "@babel/types";
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from "@babel/generator";
import { Stack, Button, Divider } from '@mui/material';
import { ConstructorNames, ModifierNames, CommandName, InsertDirection, Command, checkValidity, checkCommands, createCommand } from '../utils/check_commands'
import { perturb } from '../utils/perturb';


interface SketchProps {
  state: StateObject;
  code: string;
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void;
  stateArray: StateObject[];
  setNumSketches: React.Dispatch<React.SetStateAction<number[]>>
  setLastClicked: React.Dispatch<React.SetStateAction<number>>
  lastClicked: number;
}

export const Sketch: React.FC<SketchProps> = ({state, code, updateState, stateArray, setNumSketches, setLastClicked, lastClicked }) => {
  const [dims, setDims] = useState<string[]>(['320px','320px']);
  const [hasError, setHasError] = useState<boolean>(false);
  
  const handleClick = () => { // find out how to log what was clicked
    try {
      updateState(0, "sketchCode", code);
    } catch (e) {
      console.error('couldnt update state', e)
    }

    const { possibleCodes, addedFuncs, lines } = perturb(code, state.lineInserted!, state);
    const numSketches = addedFuncs.filter(x => x.length > 0).map((x) => x.length);
    setNumSketches(numSketches);

    let counter = 0
    for (let i = 0; i < possibleCodes.length; i++) {
      for (let j = 0; j < possibleCodes[i].length; j++) {
        updateState(counter+1, "sketchCode", possibleCodes[i][j])
        updateState(counter+1, "addedFunction", addedFuncs[i][j])
        updateState(counter+1, 'lineInserted', lines[i][j])
        counter += 1
      }
    }
    console.log('stateArray after sketch click: ',stateArray)
  };  

  const generateSrcDoc = (sketch: string) => {
    return `
    <!doctype html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js" onerror="function() {alert('Error loading ' + this.src);};"></script>
      </head>
      <body>
        <script>
          ${sketch}
        </script>
      </body>
    <html>`
  }

  const iframeRef = useRef<HTMLIFrameElement>(null);
  let src_code = generateSrcDoc(state.sketchCode)
  
  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;

    const handleLoad = () => {
      // Check if the iframe's contentDocument is accessible
      // and whether it contains any error messages
      if (iframe.contentDocument?.querySelector("body script[src^='chrome-error://']")) {
        setHasError(true);
        console.error("error in iframe")
      }
    };

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, []);

  return (
    <div style={{}}>
      {(!state.displayName || state.addedFunction) && 
      <div style={{ display: 'flex', width: 'fit-content', height: 'fit-content', overflow: 'hidden' }} onClick={handleClick}>
        <Stack>
        <iframe 
            onLoad={(e) => {
              const iframe = e.currentTarget;
              if (iframe.contentWindow?.document.body) {
                iframe.style.height = iframe.contentWindow.document.body.scrollHeight+20 + "px";
                iframe.style.width = iframe.contentWindow.document.body.scrollWidth+20 + "px";
              }
            }}
            style={{height:"300px", width:"100%", border: "none", overflow: "hidden"}}
            srcDoc={src_code}
            title={state.addedFunction} 
          />
          <Button color="inherit" size='small' style={{textTransform: 'none'}} >{state.addedFunction}</Button>
        </Stack>
      </div>
      }
    </div>
  );
};
