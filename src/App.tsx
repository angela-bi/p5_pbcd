import React, { useState, useRef } from 'react';
import './App.css';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';
import { Button } from './components/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { useEffect } from 'react';
import { Stack, Typography } from '@mui/material';
import SketchRow from './components/SketchRow';

export interface StateObject {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  sketchCode: string;
  currentEditorCode?: string;
  p5_appended: boolean;
  addedFunction?: string;
  isMain: boolean;
  // id: number; this would be used to distinguish between functions of the same type
}

function App() {
  // number of sketches per row should be the number of parameters in a function
  // when user first enters page, there should only be one sketch
  const [stateArray, setStateArray] = useState<StateObject[]>([]);
  const [userClicked, setUserClicked] = useState<boolean>(false);
  const [numSketches, setNumSketches] = useState<number[]>([]);

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
  };  
  
  const startSketch = (state: StateObject, code: string): StateObject => {
    const iframe = state.iframeRef.current

    if (iframe) {
      // if p5 appended, remove it
      if (state.p5_appended == true) {
        for (let i = 0; i < iframe.contentDocument!.scripts.length; i++) {
          if (iframe.contentDocument!.scripts[i].id === 'p5-script') {
            iframe.contentDocument!.scripts[i].remove()
          }
        }
      }
      // add updated script, no matter if p5_appended is true or false
      const url = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js';
      let script = document.createElement('script');
      script.onerror = () => {
        console.log("Failed to load script: " + url);
      };
      script.setAttribute('src', url);
      script.id = "p5-script";
      iframe.contentDocument!.body.appendChild(script);
      state.p5_appended = true

      // if existing sketch script, remove
      if (state.sketchCode) {
        for (let i = 0; i < iframe.contentDocument!.scripts.length; i++) {
          if (iframe.contentDocument!.scripts[i].id === 'sketch-script') {
            iframe.contentDocument!.scripts[i].remove()
          }
        }
      }
      let newSketchScript = document.createElement('script');
      newSketchScript.textContent = code;
      newSketchScript.id = "sketch-script";
      iframe.contentDocument!.body.appendChild(newSketchScript);
    }
    return state; // so that later we can update this object in array
  }

  const defaultSketchCode = `function setup() {
  createCanvas(300, 300);
}
function draw() {
  background(220);
  ellipse(50, 50, 50, 50);
}`;

  useEffect(() => {  
    setStateArray((prevState) => {
      const newStateArray = Array.from({ length: 11 }, (_, index) => ({
        iframeRef: prevState[index]?.iframeRef || React.createRef<HTMLIFrameElement>(),
        sketchCode: prevState[index]?.sketchCode || defaultSketchCode,
        p5_appended: false,
        addedFunction: prevState[index]?.addedFunction || "",
        isMain: index === 0 ? true : false
      }));

      return newStateArray;
    });
  }, []);
  
  useEffect(() => {
    stateArray.forEach((state, index) => {
      let newState = startSketch(state, state.sketchCode)
      state = newState
    });
  }, [stateArray]);
  
  const firstState = stateArray[0]

  const [currentEditorCode, setCurrentEditorCode] = useState(`function setup() {
  createCanvas(300, 300);
  background(220);
}

function draw() {
  ellipse(50, 50, 50, 50);
}
`)

  return (
    <div className="App">
      <Box>
        <Grid container spacing={2}>
            {firstState && (
              <Grid size={3}>
                <Button
                code={firstState.sketchCode}
                currentEditorCode={currentEditorCode}
                updateState={updateStateProperty}
                />
                <Editor
                code={firstState.sketchCode}
                setCurrentEditorCode={setCurrentEditorCode}
                updateState={updateStateProperty}
                userClicked={userClicked}
                setUserClicked={setUserClicked}
                setNumSketches={setNumSketches}
                />
                <div>
                  {stateArray.map((state, index) => {
                  if (index === 0) {
                    return (
                    <Sketch
                      stateArray={stateArray}
                      state={state}
                      code={state.sketchCode}
                      updateState={updateStateProperty}
                      setNumSketches={setNumSketches}
                    />)
                  }
                  })}
                </div>
              </Grid>
            )}
          <Grid size={9}>
            <div style={{ maxHeight: "100vh", overflowY: "auto" }}>
              {userClicked && 
                numSketches.map((num, index) => ( // where num is the number of sketches per row and index is the ith row
                  <Stack key={index}>
                    <SketchRow
                      updateState={updateStateProperty}
                      stateArray={stateArray}
                      numSketches={numSketches}
                      setNumSketches={setNumSketches}
                      index={index}
                    />
                  </Stack>
              ))}
            </div>
          </Grid>
        </Grid>
      </Box>
    </div>
  );}
  
export default App;
