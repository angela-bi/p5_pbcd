import React from 'react';
import { useState, useEffect, useRef } from 'react';
import p5 from 'p5';
import { createPortal } from 'react-dom'

interface SketchProps {
  code: string;
  // children: React.ReactNode
}

export interface Runner extends Window {
  startSketch: (sketch: string, baseURL: string ) => void
}

interface PreviewFrameWindow extends Runner {
  // This is exported by p5 when it's in global mode.
  noLoop: () => void;

  // This is the p5 constructor. An undocumented feature is that
  // even the first argument is actually *optional*; if omitted,
  // p5 will initialize itself in global mode.
  p5: (sketch?: Function, node?: HTMLElement, sync?: boolean) => void;
}

declare let window: PreviewFrameWindow;

declare global {
  interface Window {
    startSketch: (sketch: string, baseURL: string ) => void;
    p5: (sketch?: Function, node?: HTMLElement, sync?: boolean) => void;
  }
}

export const Sketch: React.FC<SketchProps> = ({code}) => {

  function startSketch(sketch: string, dom: Document, cb?: () => void) {
  
    let sketchScript = document.createElement('script');
    sketchScript.textContent = sketch;
    dom.body.appendChild(sketchScript);
    
    const url = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js'
    let script = document.createElement('script');
    cb = cb || (() => {}); // cb stands for callback
    script.onload = cb;
    script.onerror = () => {
      console.log("Failed to load script: " + url);
    };
    script.setAttribute('src', url);

    dom.body.appendChild(script);
  }

  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);
  const mountNode = contentRef?.contentWindow?.document?.body
  const iframeRef = useRef<HTMLIFrameElement | null>(null); // iframeRef helps attach the iframe rendered to the reference
  console.log('iframeRef', iframeRef)

  useEffect(() => {
    const iframeDoc = iframeRef.current?.contentWindow?.document; // this is referring to the iframe rendered
    console.log("iframedoc", iframeDoc)
    let iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'preview-frame.html');
    if (iframeDoc) {
      console.log('startsketch called')
      startSketch(code, iframeDoc);
      iframeRef.current = iframe
    }
  }, []);

  return (
    <div>
      <iframe ref={iframeRef} style={{height:'400px', width:'400px'}}>
        {mountNode && createPortal(code, mountNode)}
      </iframe>
    </div>
  );
}
