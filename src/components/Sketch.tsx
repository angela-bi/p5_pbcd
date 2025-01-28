import React from 'react';
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { StateObject } from '../App';

interface SketchProps {
  state: StateObject
  code: string;
  startSketch: (state: StateObject, code: string) => StateObject
}

export const Sketch = forwardRef<HTMLIFrameElement, SketchProps>(
  ({state, code, startSketch}, ref) => {

  startSketch(state, code)

  return (
    <div style={{ height: '300px', width: '300px', padding: 0, margin: 0, border: 'none', position: 'relative' }}>
      <iframe ref={state.iframeRef} style={{ width: '100%', height: '100%', border: 'none', padding: 0, margin: 0 }} />
    </div>
  );
});
