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


export interface StateObject {
  sketchCode: string;
  currentEditorCode?: string;
  addedFunction?: string;
  displayName: string;
  lineInserted?: Loc;
}

// Escape hatch if state gets messed up
(window as any).resetInterface = () => {
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
  const [currentEditorCode, _setCurrentEditorCode] = useState<string>(defaultSketchCode)

  function setStateArray(
    arg: StateObject[] | ((_: StateObject[]) => StateObject[])
  ) {
    _setStateArray((prevArg) => {
      let newArg = typeof arg == "function" ? arg(prevArg) : arg;
      if (newArg && newArg.length > 0 && newArg[0].currentEditorCode) {
        localStorage.setItem(
          "savedCode",
          JSON.stringify(newArg[0].currentEditorCode)
        );
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
        localStorage.setItem(
          "savedCode",
          JSON.stringify(newArg)
        );
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
  function updateCodeState(curr_pos: Loc) {
    const newPrograms = samplePrograms(perturb(defaultSketchCode, curr_pos), 10).sort((a, b) => a.index > b.index ? -1 : 1)

    const programsWithTitles: any = {}
    newPrograms.forEach((insertion) => {
      if (insertion.index in programsWithTitles) {
        programsWithTitles[insertion.index]++
      } else {
        programsWithTitles[insertion.index] = 1
      }
    })

    const actualNumSketches = Object.keys(programsWithTitles).map((key) => programsWithTitles[key])
    console.log(actualNumSketches)

    setNumSketches(actualNumSketches);

    const newStateArray: StateObject[] = [];
    newStateArray.push({
      sketchCode: defaultSketchCode,
      displayName: "",
    })

    const stateAdd = newPrograms.map((insertion) => {
      return {
        sketchCode: insertion.program,
        addedFunction: insertion.title,
        displayName: insertion.index
      }
    })

    setStateArray([...newStateArray, ...stateAdd]);
  }
  useEffect(() => {
    document.title = "p5.js Web Editor";

    const curr_pos = { start: lastClicked, end: lastClicked } as Loc
    console.log("Use effect update!")
    updateCodeState(curr_pos)

  }, []);

  const firstState = stateArray[0]

  return (
    <div className="App">
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
                  <Sketch
                    stateArray={stateArray}
                    state={state}
                    code={state.sketchCode}
                    updateState={updateStateProperty}
                    setNumSketches={setNumSketches}
                    setLastClicked={setLastClicked}
                    lastClicked={lastClicked}
                    key={crypto.randomUUID()} />)
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
                <div key={index}>
                  <SketchRow
                    updateState={updateStateProperty}
                    stateArray={stateArray}
                    numSketches={numSketches}
                    setNumSketches={setNumSketches}
                    index={index}
                    setLastClicked={setLastClicked}
                    lastClicked={lastClicked}
                  />
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
