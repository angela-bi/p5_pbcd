import React from 'react';
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';

interface SketchProps {
  sketchCode: string;
  editorCode: string;
  startSketch: (sketchCode: string, editorCode: string, dom: Document) => void;
}

declare global {
  interface Window {
    startSketch: (sketch: string, baseURL: string) => void;
    p5: (sketch?: Function, node?: HTMLElement, sync?: boolean) => void;
  }
}

export const Sketch = forwardRef<HTMLIFrameElement, SketchProps>(
  ({ sketchCode, editorCode, startSketch }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    // Use useImperativeHandle to expose iframeRef to the parent
    useImperativeHandle(ref, () => iframeRef.current as HTMLIFrameElement);


  useEffect(() => {
    const iframeDoc = iframeRef.current?.contentWindow?.document;

    // if  existing iframe document, clear its body before re-rendering
    if (iframeRef && iframeDoc) {
      // iframeRef.current?.contentWindow?.location.reload()

      startSketch(sketchCode, editorCode, iframeDoc);
    }
  }, [sketchCode]);

  return (
    <div>
      <iframe ref={iframeRef} style={{ height: '400px', width: '400px' }} />
    </div>
  );
});
