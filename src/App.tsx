import React, { useState, useRef } from 'react';
import './App.css';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';
import { Button } from './components/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { useEffect } from 'react';
import { Divider, Stack, Typography } from '@mui/material';
import SketchRow from './components/SketchRow';
import { Loc, perturb } from './utils/perturb';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { Header } from './components/Header';
// import { Console } from './components/Console';

export interface StateObject {
  sketchCode: string;
  currentEditorCode?: string;
  addedFunction?: string;
  displayName: boolean;
  lineInserted?: Loc;
}

// Escape hatch if state gets messed up
const _window = window as any;
_window.resetInterface = () => {
  localStorage.clear();
  window.location.reload();
}

function App() {
  // number of sketches per row should be the number of parameters in a function
  // when user first enters page, there should only be one sketch

  const localSavedCode = localStorage.getItem("savedCode");

  const defaultSketchCode = localSavedCode ?
      JSON.parse(localSavedCode) :
      `function setup() {
  createCanvas(300, 300);
}
function draw() {
  background(220);
  fill(0, 0, 0, 0)
  ellipse(50, 50, 50, 50);
}`;

  const [stateArray, _setStateArray] = useState<StateObject[]>([]);
  const [numSketches, setNumSketches] = useState<number[]>([]);
  const [lastClicked, setLastClicked] = useState<number>(114);
  const [currentEditorCode, _setCurrentEditorCode] = useState(defaultSketchCode)

  function setStateArray(
      arg: StateObject[] | ((_: StateObject[]) => StateObject[])
  ) {
      _setStateArray(arg);
      if (stateArray && stateArray.length > 0) {
          localStorage.setItem("savedCode", JSON.stringify(stateArray[0]));
      }
  }

  function setCurrentEditorCode(
      arg: string | ((_: string) => string)
  ) {
      _setCurrentEditorCode(arg);
      localStorage.setItem("savedCode", JSON.stringify(currentEditorCode));
  }

  const updateStateProperty = <K extends keyof StateObject>(
    index: number,
    key: K,
    value: StateObject[K]
  ) => {
    setStateArray((prevArray) =>
      prevArray.map((state, i) =>
        i === index ? { ...state, [key]: value } : state
      )
    );
    setStateArray((prevArray) => [...prevArray]); // to ensure update
  };

  function getIndices(counter: number, nestedList: any[][]) {
    let i = 0;
    let cumulativeCount = 0;
    while (i < nestedList.length) {
      if (counter < cumulativeCount + nestedList[i].length) {
        break;
      }
      cumulativeCount += nestedList[i].length;
      i++;
    }
    let j = counter - cumulativeCount;
    return { i, j };
  }

  useEffect(() => {
    const curr_pos = {start: lastClicked, end: lastClicked} as Loc
    const { possibleCodes, addedFuncs, lines } = perturb(defaultSketchCode, curr_pos, undefined);
    const numSketches = addedFuncs.map((x) => x.length);
    setNumSketches(numSketches);
    const totalNumSketches = numSketches.flat().reduce((d, i) => d + i, 0)
    
    const newStateArray: StateObject[] = [];
    newStateArray.push({
      sketchCode: defaultSketchCode,
      displayName: false,
    })
    for (let counter = 0; counter < totalNumSketches; counter++) {
      const {i, j} = getIndices(counter, possibleCodes)
      newStateArray.push({
        sketchCode: possibleCodes[i][j],
        addedFunction: addedFuncs[i][j],
        displayName: counter === 0 ? false : true,
        lineInserted: lines[i][j]
      })
    }
    setStateArray(newStateArray);
  }, []);  
  
  const firstState = stateArray[0]

  return (
    <div className="App">
      <Box>
        <Stack>
        <Header/>
        <Grid container spacing={2}>
            {firstState && (
              <Grid size={3}>
                <Button
                code={firstState.sketchCode}
                currentEditorCode={currentEditorCode}
                updateState={updateStateProperty}
                stateArray={stateArray}
                />
                <Editor
                code={firstState.sketchCode}
                setCurrentEditorCode={setCurrentEditorCode}
                updateState={updateStateProperty}
                stateArray={stateArray}
                setNumSketches={setNumSketches}
                setLastClicked={setLastClicked}
                />
                <div>
                {/* <Console></Console> */}
                  {stateArray.map((state, index) => {
                  if (index === 0) {
                    return (
                    <Sketch
                      stateArray={stateArray}
                      state={state}
                      code={state.sketchCode}
                      updateState={updateStateProperty}
                      setNumSketches={setNumSketches}
                      setLastClicked={setLastClicked}
                      lastClicked={lastClicked}
                      key={crypto.randomUUID()}
                    />)
                  }
                  })}
                </div>
              </Grid>
            )}
          <Grid size={9} style={{
        borderStyle: 'solid',
        borderColor: 'rgba(0, 0, 0, 0.12)',
        borderWidth: '0 0 0 1px'
      }}>
            <div style={{ maxHeight: "100vh", overflowY: "auto" }}>
              {numSketches.map((num, index) => ( // where num is the number of sketches per row and index is the ith row
                  <Stack key={index}>
                    <SketchRow
                      updateState={updateStateProperty}
                      stateArray={stateArray}
                      numSketches={numSketches}
                      setNumSketches={setNumSketches}
                      index={index}
                      setLastClicked={setLastClicked}
                      lastClicked={lastClicked}
                    />
                  </Stack>
              ))}
            </div>
          </Grid>
        </Grid>
        </Stack>
      </Box>
    </div>
  );}
  
export default App;
