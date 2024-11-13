import React from 'react';
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';

interface SketchProps {
  sketchCode: string;
  editorCode: string;
  startSketch: (iframeRef: React.MutableRefObject<HTMLIFrameElement | null>, code: string, cb?: () => void) => void;
}

export const Sketch = forwardRef<HTMLIFrameElement, SketchProps>(
  ({ sketchCode, editorCode, startSketch }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    // Use useImperativeHandle to expose iframeRef to the parent
    useImperativeHandle(ref, () => iframeRef.current as HTMLIFrameElement);


  useEffect(() => {

    // if  existing iframe document, clear its body before re-rendering
    if (iframeRef) {
      // iframeRef.current?.contentWindow?.location.reload()

      startSketch(iframeRef, editorCode);
    }
  }, []);

  return (
    <div>
      <iframe ref={iframeRef} style={{ height: '400px', width: '400px' }} />
    </div>
  );
});
