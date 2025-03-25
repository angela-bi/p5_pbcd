import React, { useEffect, useState } from 'react'
import { StateObject } from '../App'
import { Sketch } from './Sketch'
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generate from "@babel/generator";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IconButton from '@mui/material/IconButton';
import { v4 as uuidv4 } from 'uuid';
interface SketchRowProps {
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void
  stateArray: StateObject[] // this is only the section that is rendered
  setNumSketches: React.Dispatch<React.SetStateAction<number[]>>
  numSketches: number[];
  index: number;
  setLastClicked: React.Dispatch<React.SetStateAction<number>>
  lastClicked: number;
}

const SPECIAL_ROWS: { [k: string]: string } = { "Special": "Modify parameters" };

export const SketchRow: React.FC<SketchRowProps> = ({ updateState, stateArray, index, numSketches, setNumSketches, setLastClicked, lastClicked }) => {
  // get sketches for that row to render
  const [limit, setLimit] = useState<number>(3);

  const start = numSketches.slice(0, index).reduce((sum, val) => sum + val, 0) + 1
  const end = start + Math.min(limit, numSketches[index])
  const sketches = stateArray.slice(start, end)

  // find function to render: get the first state of the row, parse it for the first Identifier
  // if (sketches.length !== 0 && sketches[0].addedFunction != undefined) {
  //   let ast = parser.parse(sketches[0].addedFunction!)
  //   traverse(ast, {
  //     CallExpression(path) {
  //       if (path.node.callee.type === "Identifier") {
  //         functionName = path.node.callee.name;
  //       }
  //     },
  //   });
  // }
  // TODO: don't render function name if it's a param row
  //backgroundColor: 'rgba(135,206,250, 0.2)

  const assignedDisplayName = sketches[0]?.displayName;
  const special = SPECIAL_ROWS.hasOwnProperty(assignedDisplayName);
  useEffect(() => {
    if (special) {
      setLimit(8)
    }
  }, []);

  const displayName = special ? SPECIAL_ROWS[assignedDisplayName] : assignedDisplayName;

  const delay = index * 200
  return (
    <div className="sketch-row" data-special={special}>
      <div>
        {numSketches[index] > 5 && limit !== numSketches[index] &&
          <button onClick={() => {
            setLimit(Math.min(limit + 5, numSketches[index]))
          }} className="show-more-button">
            <span>+</span>
          </button>
        }
      </div>
      <h3>{displayName}</h3>
      <div>
        {sketches.map((state) => {
          return (
            <Sketch
              stateArray={stateArray}
              state={state}
              code={state.sketchCode}
              updateState={updateState}
              delay={delay}
              setNumSketches={setNumSketches}
              setLastClicked={setLastClicked}
              lastClicked={lastClicked}
              key={uuidv4()}
            />)
        })}
      </div>
    </div>
  )
}

export default SketchRow;
