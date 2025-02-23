import React, { useState } from 'react'
import { StateObject } from '../App'
import { Sketch } from './Sketch'
import Stack from '@mui/material/Stack';
import { Typography } from '@mui/material';
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generate from "@babel/generator";

interface SketchRowProps {
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void
  stateArray: StateObject[] // this is only the section that is rendered
  setNumSketches: React.Dispatch<React.SetStateAction<number[]>>
  numSketches: number[];
  index: number;
}

export const SketchRow: React.FC<SketchRowProps> = ({updateState, stateArray, index, numSketches, setNumSketches}) => {
  // get sketches for that row to render
  const start = numSketches.slice(0,index).reduce((sum, val) => sum + val, 0) + 1
  const end = start + numSketches[index] 
  const sketches = stateArray.slice(start, end)
  
  // find function to render: get the first state of the row, parse it for the first Identifier
  let functionName = ''
  if (sketches.length !== 0 && sketches[0].addedFunction != undefined) {
    let ast = parser.parse(sketches[0].addedFunction!)
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.type === "Identifier") {
          functionName = path.node.callee.name;
        }
      },
    });
  }

  return (
    <div style={{overflowX: 'auto'}}>
      <Typography>{functionName}</Typography>
      <Stack direction="row" style={{height: '360px'}}>
      {sketches.map((state) => {
        return (
        <Sketch
          stateArray={stateArray}
          state={state}
          code={state.sketchCode}
          updateState={updateState}
          setNumSketches={setNumSketches}
        />)
      })}
    </Stack>
    </div>
  )
}

export default SketchRow;