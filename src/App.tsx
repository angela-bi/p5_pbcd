import React, { useState } from 'react';
import './App.css';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';
import { Button } from './components/Button';

function App() {

  function startSketch(sketchCode: string, editorCode: string, dom: Document, cb?: () => void) {
    const existingP5Script = Array.from(dom.body.querySelectorAll('script')).find(
      (script) => script.src === 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js'
    );
  
    if (!existingP5Script) {
      const url = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js';
      let script = document.createElement('script');
      cb = cb || (() => {}); // cb stands for callback
      script.onload = cb;
      script.onerror = () => {
        console.log("Failed to load script: " + url);
      };
      script.setAttribute('src', url);
  
      dom.body.appendChild(script);
    } else {
      console.log("p5.js script already loaded");
    }
  
    // const existingSketchScript = Array.from(dom.body.querySelectorAll('script')).find(
    //   (script) => script.textContent === sketchCode
    // );

    // if (existingSketchScript) {
    //   console.log('Removing old sketch script...');
    //   existingSketchScript.remove();
    // }
    Array.from(dom.body.querySelectorAll('script')).forEach((script) => {
      if (script.src !== 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js') {
        script.remove();
      }
    });

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
        <Button sketchCode={sketchCode} editorCode={editorCode} setSketchCode={setSketchCode} startSketch={startSketch}></Button>
        <Editor sketchCode={sketchCode} editorCode={editorCode} setEditorCode={setEditorCode}></Editor>
        <Sketch sketchCode={sketchCode} editorCode={editorCode} startSketch={startSketch}></Sketch>
      </div>
    </div>
  );
}

export default App;
