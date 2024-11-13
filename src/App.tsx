import React, { useState, useRef } from 'react';
import './App.css';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';
import { Button } from './components/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';

function App() {
  const numberOfSketches = 3;
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>(Array(numberOfSketches).fill(null));

  function startSketch(iframeRef: React.MutableRefObject<HTMLIFrameElement | null>, code: string, cb?: () => void) {
    let iframe = iframeRef.current?.contentWindow?.document

    if (iframe) {
      // detach current iframe if exists
      iframe.parentNode?.removeChild(iframe);

      // create and attach p5
      const url = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js';
      const existingScript = iframe.querySelector(`script[src='https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js']`);
      if (!existingScript) {
        let script = document.createElement('script');
        cb = cb || (() => {}); // Callback for when p5.js loads
        script.onload = cb;
        script.onerror = () => {
          console.log("Failed to load script: " + url);
        };
        script.setAttribute('src', url);
        iframe.body.appendChild(script);
      }

      // create and attach code
      let newSketchScript = document.createElement('script');
      newSketchScript.textContent = code;
      iframe.body.appendChild(newSketchScript);
    }

  }

  const [sketchCode, setSketchCode] = useState<string>(
`function setup() {
  createCanvas(400, 400);
  background(220);
}

function draw() {
  ellipse(50, 50, 50, 50);
}
  `);

  const [editorCode, setEditorCode] = useState<string>(
`function setup() {
  createCanvas(400, 400);
  background(220);
}

function draw() {
  ellipse(50, 50, 50, 50);
}
  `);

  const firstIFrameRef = useRef<HTMLIFrameElement | null>(null);

  return (
    <div className="App">
      <div>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}> 
            <Grid size={12}>
              <Button sketchCode={sketchCode} editorCode={editorCode} setSketchCode={setSketchCode} startSketch={startSketch} iframeRef={firstIFrameRef}></Button>
              <Editor startSketch={startSketch} editorCode={editorCode} setEditorCode={setEditorCode} iframeRefs={iframeRefs}></Editor>
              <div>
                {Array.from({ length: numberOfSketches-1 }, (_, index) => (
                  <div key={index}>
                    <Sketch
                      ref={(el) => {
                        iframeRefs.current[index] = el;
                        // Assign the first ref to firstSketchRef as well
                        if (index === 0) {
                          firstIFrameRef.current = el;
                        }
                      }}
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
