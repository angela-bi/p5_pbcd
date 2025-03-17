import React, { useState } from 'react'
import { StateObject } from '../App'
import { Sketch } from './Sketch'
import Stack from '@mui/material/Stack';
import { Divider, Typography } from '@mui/material';
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
  setLastClicked: React.Dispatch<React.SetStateAction<number>>
  lastClicked: number;
}

export const SketchRow: React.FC<SketchRowProps> = ({updateState, stateArray, index, numSketches, setNumSketches, setLastClicked, lastClicked}) => {
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
  // TODO: don't render function name if it's a param row
  //backgroundColor: 'rgba(135,206,250, 0.2)
  return (
    <div style={{margin: '10px'}}>
      <div style={{ borderBottom: '1px dotted rgba(0,0,0,0.12)'}}>
      <Typography>{functionName}</Typography>
      <Stack direction="row" style={{overflow: 'scroll'}}>
      {sketches.map((state) => {
        return (
        <Sketch
          stateArray={stateArray}
          state={state}
          code={state.sketchCode}
          updateState={updateState}
          setNumSketches={setNumSketches}
          setLastClicked={setLastClicked}
          lastClicked={lastClicked}
          key={crypto.randomUUID()}
        />)
      })}
      <Divider></Divider>
    </Stack>
    </div>
    </div>
  )
}

export default SketchRow;
