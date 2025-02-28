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
  displayName: boolean;
  // id: number; this would be used to distinguish between functions of the same type
}

function App() {
  // number of sketches per row should be the number of parameters in a function
  // when user first enters page, there should only be one sketch
  const [stateArray, setStateArray] = useState<StateObject[]>([]);
  const [userClicked, setUserClicked] = useState<boolean>(false);
  const [numSketches, setNumSketches] = useState<number[]>([]);
  const [lastInserted, setLastInserted] = useState<number>(0);

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
  
  const startSketch = (index: number, code: string): void => {
    const state = stateArray[index];
    const iframe = state?.iframeRef?.current;
  
    if (iframe) {
      const doc = iframe.contentDocument;
      if (!doc) return;
        if (!doc.getElementById("p5-script")) {
        const url = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js";
        let script = document.createElement("script");
        script.onerror = () => console.log("Failed to load script: " + url);
        script.setAttribute("src", url);
        script.id = "p5-script";
        doc.body.appendChild(script);
  
        setStateArray((prevArray) =>
          prevArray.map((s, i) => (i === index ? { ...s, p5_appended: true } : s))
        );
      }
  
      const oldSketch = doc.getElementById("sketch-script");
      if (oldSketch) oldSketch.remove();
  
      let newSketchScript = document.createElement("script");
      newSketchScript.textContent = code;
      newSketchScript.id = "sketch-script";
      doc.body.appendChild(newSketchScript);
    }
  };  

  const defaultSketchCode = `function setup() {
  createCanvas(300, 300);
}
function draw() {
  background(220);
  ellipse(50, 50, 50, 50);
}`;

  useEffect(() => {  
    setStateArray((prevState) => {
      const newStateArray = Array.from({ length: 20 }, (_, index) => ({
        iframeRef: prevState[index]?.iframeRef || React.createRef<HTMLIFrameElement>(),
        sketchCode: prevState[index]?.sketchCode || defaultSketchCode,
        p5_appended: false,
        addedFunction: prevState[index]?.addedFunction || "",
        displayName: index === 0 ? false : true
      }));

      return newStateArray;
    });
  }, []);
  
  useEffect(() => {
    stateArray.forEach((state, index) => {
      if (state.iframeRef.current) startSketch(index, state.sketchCode);
    });
  }, [JSON.stringify(stateArray.map((state) => state.sketchCode))]);   
  
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
                stateArray={stateArray}
                startSketch={startSketch}
                />
                <Editor
                code={firstState.sketchCode}
                setCurrentEditorCode={setCurrentEditorCode}
                updateState={updateStateProperty}
                userClicked={userClicked}
                setUserClicked={setUserClicked}
                setNumSketches={setNumSketches}
                setLastInserted={setLastInserted}
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
                      setLastInserted={setLastInserted}
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
                      setLastInserted={setLastInserted}
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
