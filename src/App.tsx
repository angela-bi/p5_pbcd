import { useState } from 'react';
import './App.css';
import { Sketch } from './components/Sketch';
import { Editor } from './components/Editor';

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

  return (
    <div className="App">
      <div>
        <Editor code={code} setCode={setCode}></Editor>
        <Sketch code={code}></Sketch>
      </div>
    </div>
  );
}

export default App;
