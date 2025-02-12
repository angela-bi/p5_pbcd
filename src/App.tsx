import React, { useState, useRef } from 'react';
import './App.css';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';
import { Button } from './components/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { useEffect } from 'react';
import { Stack, Typography } from '@mui/material';

export interface StateObject {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  sketchCode: string;
  currentEditorCode?: string;
  p5_appended: boolean;
  addedFunction?: string;
}

function App() {
  let numberOfSketches = 4
  // number of sketches per row should be the number of parameters in a function
  // when user first enters page, there should only be one sketch
  const [stateArray, setStateArray] = useState<StateObject[]>([]);
  const [userClicked, setUserClicked] = useState<boolean>(false);

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
    //console.log('line 34 state', state)

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

  useEffect(() => {
    const sketchCode = `function setup() {
  createCanvas(300, 300);
  background(220);
}

function draw() {
  ellipse(50, 50, 50, 50);
}
`;
  
    const initialArray = Array.from({ length: numberOfSketches }, () => ({
      iframeRef: React.createRef<HTMLIFrameElement>(),
      sketchCode: sketchCode,
      p5_appended: false,
      sketch_appended: false,
      addedFunction: ''
    }));
  
    setStateArray(initialArray);
  }, [numberOfSketches]);
  
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
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
            {firstState && (
              <Grid size={4}>
                <Button
                code={firstState.sketchCode}
                currentEditorCode={currentEditorCode}
                updateState={updateStateProperty}
                />
                <Editor
                startSketch={startSketch}
                code={firstState.sketchCode}
                refs={stateArray}
                setCurrentEditorCode={setCurrentEditorCode}
                updateState={updateStateProperty}
                userClicked={userClicked}
                setUserClicked={setUserClicked}
                />
                <div>
                  {stateArray.map((state, index) => {
                  if (index === 0) {
                    return (
                    <Sketch
                      firstState={firstState}
                      stateArray={stateArray}
                      state={state}
                      code={state.sketchCode}
                      startSketch={startSketch}
                      updateState={updateStateProperty}
                    />)
                  }
                  })}
                </div>
              </Grid>
            )}
          <Grid size={8}>
            <Grid container spacing={2}>
              {userClicked && stateArray.map((state, index) => {
                if (index !== 0) {
                  return <Stack key={index}>
                  <Sketch
                    firstState={firstState}
                    state={state}
                    code={state.sketchCode}
                    startSketch={startSketch}
                    updateState={updateStateProperty}
                    stateArray={stateArray}
                  />
                </Stack>
                }
              })}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </div>
  );}
  
export default App;
