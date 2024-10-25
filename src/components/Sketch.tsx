import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'

interface SketchProps {
  sketchCode: string;
  editorCode: string;
  //(code: string, viewUpdate: ViewUpdate) => void
  startSketch: (sketchCode:string, editorCode:string, dom: Document ) => void;
}

declare global {
  interface Window {
    startSketch: (sketch: string, baseURL: string ) => void;
    p5: (sketch?: Function, node?: HTMLElement, sync?: boolean) => void;
  }
}

export const Sketch: React.FC<SketchProps> = ({sketchCode, editorCode, startSketch}) => {

  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);
  const mountNode = contentRef?.contentWindow?.document?.body
  const iframeRef = useRef<HTMLIFrameElement | null>(null); // iframeRef helps attach the iframe rendered to the reference

  useEffect(() => {
    console.log('sketchCode changed')

    const iframeDoc = iframeRef.current?.contentWindow?.document; // this is referring to the iframe rendered
    console.log("iframedoc", iframeDoc)
    
    if (iframeDoc) {
      console.log('iframe.contentwindow.document', iframeDoc)
      startSketch(sketchCode, editorCode, iframeDoc);
    }
  }, []);

  return (
    <div>
      <iframe ref={iframeRef} style={{height:'400px', width:'400px'}}>
        {mountNode && createPortal(sketchCode, mountNode)}
      </iframe>
    </div>
  );
}
