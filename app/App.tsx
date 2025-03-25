'use client'
import React, { useState, useRef } from 'react';
import './reset.css'
import './App.css';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';
import { Button } from './components/Button';
import { useEffect } from 'react';
import SketchRow from './components/SketchRow';
import { Loc, perturb, samplePrograms } from './utils/perturb';
// import { Console } from './components/Console';
import { newInsertion } from './utils/perturb'

import useLocalStorage from "./useLocalStorage"

export interface StateObject {
  sketchCode: string;
  currentEditorCode?: string;
  addedFunction?: string;
  displayName: string;
  lineInserted?: Loc;
}



function App() {
  // number of sketches per row should be the number of parameters in a function
  // when user first enters page, there should only be one sketch



  const [stateArray, _setStateArray] = useState<StateObject[]>([]);
  const [numSketches, setNumSketches] = useState<number[]>([]);
  const [lastClicked, setLastClicked] = useState<number>(179);
  const [currentEditorCode, _setCurrentEditorCode] = useState<string>("")

  function setStateArray(
    arg: StateObject[] | ((_: StateObject[]) => StateObject[])
  ) {
    _setStateArray((prevArg) => {
      let newArg = typeof arg == "function" ? arg(prevArg) : arg;
      if (newArg && newArg.length > 0 && newArg[0].currentEditorCode) {
        if (typeof window !== 'undefined') {
          // console.log("set state array", JSON.stringify(newArg[0].currentEditorCode))
          localStorage.setItem(
            "savedCode",
            JSON.stringify(newArg[0].currentEditorCode)
          );
          // const item = localStorage.getItem('key)
        }

      }
      return newArg;
    });
  }

  function setCurrentEditorCode(
    arg: string | ((_: string) => string)
  ) {
    _setCurrentEditorCode((prevArg) => {
      let newArg = typeof arg == "function" ? arg(prevArg) : arg;
      if (newArg) {
        if (typeof window !== 'undefined') {
          // console.log("Set LocalStorage", JSON.stringify(newArg))
          localStorage.setItem(
            "savedCode",
            JSON.stringify(newArg)
          );
        }
      }
      return newArg;
    });
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

  //returns negative if a < b, pos if a > b, and 0 otherwise
  // fixes a setorder for some rows, for the others returns alphabetical
  function sortSketchRows(a: newInsertion, b: newInsertion): number {
    const setOrder = ["Special", "fill", "translate"]
    const setA = setOrder.indexOf(a.index)
    const setB = setOrder.indexOf(b.index)
    if (setA > -1 && setB > -1) {
      return setA - setB
    }
    if (setA > -1 && setB === -1) {
      return -1
    }
    if (setA === -1 && setB > -1) {
      return 1
    }

    return (a.index < b.index ? -1 : 1)
  }
  function updateCodeState(curr_pos: Loc, currentCode?: string) {
    // console.log("updatecodestate", currentCode ?? currentEditorCode)
    const newPrograms = samplePrograms(perturb(currentCode ?? currentEditorCode, curr_pos), 50).sort(sortSketchRows)

    // .sort((a, b) => a.index > b.index || a.index === 'Special' ? -1 : (a.index < b.index || b.index === 'Special' ? 1 : 0))
    // console.log(newPrograms)
    const programsWithTitles: { [key: string]: number } = {}
    newPrograms.forEach((insertion) => {
      // let index = 
      if (insertion.index in programsWithTitles) {
        programsWithTitles[insertion.index]++
      } else {
        programsWithTitles[insertion.index] = 1
      }
    })

    const actualNumSketches = Object.keys(programsWithTitles).map((key) => programsWithTitles[key])

    setNumSketches(actualNumSketches);

    const newStateArray: StateObject[] = [];
    newStateArray.push({
      sketchCode: currentCode ?? currentEditorCode,
      displayName: "",
    })

    const stateAdd = newPrograms.map((insertion) => {
      return {
        sketchCode: insertion.program as string,
        addedFunction: insertion.title,
        displayName: insertion.index
      }
    })

    setStateArray([...newStateArray, ...stateAdd]);
  }
  useEffect(() => {
    document.title = "p5.js Web Editor";

    const curr_pos = { start: lastClicked, end: lastClicked } as Loc



    const localSavedCode = localStorage.getItem("savedCode");
    // console.log(localSavedCode)

    let defaultSketchCode = `function setup() {
  createCanvas(300, 300);
}
function draw() {
  background(220);
  fill(0, 0, 0, 0);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      circle(i * 50, j * 50, frameCount % 200);
    }
  }
}`;
    if (localSavedCode && localSavedCode !== "") {
      defaultSketchCode = JSON.parse(localSavedCode)
    }


    // console.log("SETTING", defaultSketchCode)
    setCurrentEditorCode(() => {
      return defaultSketchCode
    });
    // console.log("CEC", currentEditorCode);
    // Escape hatch if state gets messed up
    (window as any).resetInterface = () => {
      localStorage.clear();
      window.location.reload();
    }

    updateCodeState(curr_pos, defaultSketchCode);
  }, []);

  const firstState = stateArray[0];

  const dirty = firstState?.sketchCode != currentEditorCode!;

  return (
    <div className="App" data-dirty={dirty}>
      <div id="left">
        {firstState && (
          <div id="editor-pane">
            <div className="toolbar">
              <h2>Sketch</h2>
              <Button
                code={firstState.sketchCode}
                currentEditorCode={currentEditorCode}
                updateState={updateStateProperty}
                stateArray={stateArray} />
            </div>
            <Editor
              code={firstState.sketchCode}
              setCurrentEditorCode={setCurrentEditorCode}
              updateState={updateStateProperty}
              updateCodeState={updateCodeState}
              stateArray={stateArray}
              setNumSketches={setNumSketches}
              setLastClicked={setLastClicked} />
          </div>
        )}
        <div id="output-pane">
          <div className="toolbar">
            <h2>Preview</h2>
          </div>
          {
            stateArray.map((state, index) => {
              if (index === 0) {
                return (
                  <div className='scrollable-main-sketch' key={index}>
                    <Sketch
                      stateArray={stateArray}
                      state={state}
                      code={state.sketchCode}
                      delay={0}
                      updateState={updateStateProperty}
                      setNumSketches={setNumSketches}
                      setLastClicked={setLastClicked}
                      lastClicked={lastClicked} />
                  </div>
                )
              }
            })
          }
        </div>
      </div>
      <div id="right">
        <div id="possibilities-pane" data-has-sketches={numSketches.length > 0}>
          <div className="toolbar">
            <h2>Possibilities<span> (Scroll right or down!)</span></h2>
          </div>
          <div id="sketch-rows">
            {
              // where num is the number of sketches per row and index is the ith row
              numSketches.map((num, index) => (
                <SketchRow
                  updateState={updateStateProperty}
                  stateArray={stateArray}
                  numSketches={numSketches}
                  setNumSketches={setNumSketches}
                  index={index}
                  setLastClicked={setLastClicked}
                  lastClicked={lastClicked}
                  key={index}
                />
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
