import React from 'react';
import { ReactP5Wrapper, P5CanvasInstance} from 'react-p5-wrapper';
import p5 from 'p5';

interface SketchProps {
  code: string;
}

interface P5Functions {
  setup: (p5Instance: p5) => void;
  draw: (p5Instance: p5) => void;
}

function convertToP5Code(inputCode: string): P5Functions {
    // Initialize empty setup and draw function strings
    let setupFunction = '';
    let drawFunction = '';
  
    // Extract the body of the setup function
    const setupMatch = inputCode.match(/function\s+setup\s*\(\)\s*{([\s\S]*?)}/);
    if (setupMatch) {
      setupFunction = setupMatch[1];
    }
  
    // Extract the body of the draw function
    const drawMatch = inputCode.match(/function\s+draw\s*\(\)\s*{([\s\S]*?)}/);
    if (drawMatch) {
      drawFunction = drawMatch[1];
    }
  
    // Helper function to prepend 'p5.' to p5.js specific functions
    const p5Functions = ['createCanvas', 'background', 'ellipse', 'rotateZ', 'rotateX', 'rotateY', 'plane', 'frameCount', 'normalMaterial', 'push', 'pop', 'mouseX', 'mouseY'];
    
    function addP5Prefix(code: string): string {
      p5Functions.forEach((fn) => {
        const regex = new RegExp(`\\b${fn}\\b`, 'g');
        code = code.replace(regex, `p5.${fn}`);
      });
      return code;
    }
  
    // Add the p5 prefix to functions inside setup and draw
    setupFunction = addP5Prefix(setupFunction);
    drawFunction = addP5Prefix(drawFunction);
  
    // Define the setup and draw functions without using eval
    const setup = (p5Instance: P5CanvasInstance) => {
      // Dynamically execute the setup function body in the context of p5Instance
      (function(p5) {
        eval(setupFunction);
      })(p5Instance);
    };
  
    const draw = (p5Instance: P5CanvasInstance) => {
      // Dynamically execute the draw function body in the context of p5Instance
      (function(p5) {
        eval(drawFunction);
      })(p5Instance);
    };
  
    return { setup, draw };
}


export const Sketch: React.FC<SketchProps> = ({code}) => {
  console.log('original string:', code)
  const p5Functions = convertToP5Code(code);

  function sketch(p5: P5CanvasInstance) {
    p5.setup = () => p5Functions.setup(p5);
    p5.draw = () => p5Functions.draw(p5);
  }

  return (
    <div>
      <ReactP5Wrapper sketch={sketch} />
    </div>
  )
}
