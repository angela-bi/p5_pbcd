import React, { useState } from 'react';
import './App.css';
import { ViewUpdate } from '@codemirror/view';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';
import { Button } from './components/Button';

function App() {

  const [code, setCode] = useState<string>(`
    function setup() {
      createCanvas(400, 400);
      background(220);
    }

    function draw() {
      ellipse(mouseX, mouseY, 50, 50);
    }
  `);

  const onChange = React.useCallback((code: string, viewUpdate: ViewUpdate) => {
    setCode(code);
  }, []);

  return (
    <div className="App">
      <div>
        <Button code={code} setCode={setCode} onChange={onChange}></Button>
        <Editor code={code} onChange={onChange}></Editor>
        <Sketch code={code}></Sketch>
      </div>
    </div>
  );
}

export default App;
