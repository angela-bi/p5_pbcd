import React, { useState, useRef } from 'react';
import './App.css';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';
import { Button } from './components/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { useEffect } from 'react';

export interface StateObject {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  sketchCode: string;
  currentEditorCode?: string;
  p5_appended: boolean;
}

function App() {
  const numberOfSketches = 4
  const [stateArray, setStateArray] = useState<StateObject[]>([]);

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
    console.log('line 34 state', state)

    if (iframe) {
      // if p5 appended, remove it
      if (state.p5_appended == true) {
        console.log('line 39 p5_appended, removing p5 script', state.p5_appended)
        for (let i = 0; i < iframe.contentDocument!.scripts.length; i++) {
          if (iframe.contentDocument!.scripts[i].id === 'p5-script') {
            iframe.contentDocument!.scripts[i].remove()
          }
        }
        console.log('iframe.contentDocument.scripts', iframe.contentDocument!.scripts)
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
        console.log('removing sketch script')
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
    }));
  
    setStateArray(initialArray);
  }, [numberOfSketches]);
  
  useEffect(() => {
    stateArray.forEach((state, index) => {
      let newState = startSketch(state, state.sketchCode)
      state = newState
      console.log('line 96 state', state)
    });
  }, [stateArray]);
  
  const firstState = stateArray[0]
  console.log(stateArray)

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
          <Grid size={4}>
            {firstState && (
              <Button
                code={firstState.sketchCode}
                currentEditorCode={currentEditorCode}
                updateState={updateStateProperty}
              />
            )}
            {firstState && (
              <Editor
              startSketch={startSketch}
              code={firstState.sketchCode}
              refs={stateArray}
              setCurrentEditorCode={setCurrentEditorCode}
              />
            )}
          </Grid>
          <Grid size={8}>
            <Grid container spacing={2}>
              {stateArray.map((state, index) => (
                <Grid size={2} key={index}>
                  <Sketch
                    state={state}
                    code={state.sketchCode}
                    startSketch={startSketch}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </div>
  );}
  
export default App;
