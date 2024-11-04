import React, { useState, useRef } from 'react';
import './App.css';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';
import { Button } from './components/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';

function App() {
  const sketchRefs = useRef<Array<HTMLDivElement | null>>([])
  const numberOfSketches = 5;

  function startSketch(sketchCode: string, editorCode: string, dom: Document, cb?: () => void) {

    const existingP5Script = Array.from(dom.body.querySelectorAll('script')).find(
      (script) => script.src === 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js'
    );
  
    // If p5.js is not found, load it
    if (!existingP5Script) {
      const url = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js';
      let script = document.createElement('script');
      cb = cb || (() => {}); // Callback for when p5.js loads
      script.onload = cb;
      script.onerror = () => {
        console.log("Failed to load script: " + url);
      };
      script.setAttribute('src', url);
  
      dom.body.appendChild(script);
    } else {
      console.log("p5.js script already loaded");
    }

    // Remove only the old sketch scripts, but leave p5.js intact
    Array.from(dom.body.querySelectorAll('script')).forEach((script) => {
      if (script.src !== 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js') {
        script.remove();
      }
    });

    // Add the new sketch code as a script
    if (sketchCode) {
      let newSketchScript = document.createElement('script');
      newSketchScript.textContent = editorCode;  // Use editorCode to apply the latest code
      dom.body.appendChild(newSketchScript);
      console.log('Updated sketch script');
    } else {
      console.log('Sketch code is empty, not updating');
    }
  }

  const [sketchCode, setSketchCode] = useState<string>(`
    function setup() {
      createCanvas(400, 400);
      background(220);
    }

    function draw() {
      ellipse(mouseX, mouseY, 50, 50);
    }
  `);

  const [editorCode, setEditorCode] = useState<string>(`
    function setup() {
      createCanvas(400, 400);
      background(220);
    }

    function draw() {
      ellipse(mouseX, mouseY, 50, 50);
    }
  `);

  return (
    <div className="App">
      <div>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}> 
            <Grid size={12}>
              <Button sketchCode={sketchCode} editorCode={editorCode} setSketchCode={setSketchCode} startSketch={startSketch}></Button>
              <Editor sketchCode={sketchCode} editorCode={editorCode} setEditorCode={setEditorCode}></Editor>
              <div>
                {Array.from({ length: numberOfSketches }, (_, index) => (
                  <div key={index}>
                    <Sketch
                      ref={(el) => (sketchRefs.current[index] = el)} // Assign each ref to the iframeRefs array
                      sketchCode={sketchCode}
                      editorCode={editorCode}
                      startSketch={startSketch}
                    />
                  </div>
                ))}
              </div>
              <Sketch sketchCode={sketchCode} editorCode={editorCode} startSketch={startSketch}></Sketch>
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
}

export default App;
