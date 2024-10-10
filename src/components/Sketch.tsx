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
let global = window;

declare global {
  interface Window {
    startSketch: (sketch: string, baseURL: string ) => void;
    p5: (sketch?: Function, node?: HTMLElement, sync?: boolean) => void;
  }
}
// let global = window as Runner;


function setBaseURL(url: string) {
  var base = document.createElement('base');
  base.setAttribute('href', url);
  document.head.appendChild(base);
}


export const Sketch: React.FC<SketchProps> = ({code}) => {

  function startSketch(sketch: string, baseURL: string) {
    function loadScript(url: string, cb?: () => void) {
      let script = document.createElement('script');
  
      cb = cb || (() => {});
  
      script.onload = cb;
      script.onerror = () => {
        console.log("Failed to load script: " + url);
      };
      script.setAttribute('src', url);
  
      document.body.appendChild(script);
    }
  
    function loadScripts(urls: string[], cb?: () => void) {
      cb = cb || (() => {});
  
      let i = 0;
      let loadNextScript = () => {
        if (i === urls.length && cb) {
          return cb();
        }
        loadScript(urls[i++], loadNextScript);
      };
  
      loadNextScript();
    }
  
    let sketchScript = document.createElement('script');
  
    if (baseURL) {setBaseURL(baseURL);}
  
    sketchScript.textContent = sketch;
    
    loadScripts([
      'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js',
      ], () => {
        document.body.appendChild(sketchScript);
        console.log(sketchScript)
        if (document.readyState === 'complete') {
          // new global.p5();
        }
      });
  }

  const iframeRef = useRef<HTMLIFrameElement>(null); // iframeRef helps attach the iframe rendered to the reference
  console.log('iframeRef', iframeRef)
  const location = window.location.href // idk if this is doing anything

  useEffect(() => {
    const iframeDoc = iframeRef.current?.contentWindow?.document; // this is referring to the iframe rendered
    console.log('iframeDoc', iframeDoc)
    let iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'preview-frame.html');
    startSketch(code,location);

    // iframe.addEventListener('load', () => {
    //   let frame = iframe.contentWindow as Runner;

    //   frame.startSketch(code, location);
    //   console.log('frame',frame)
    // });
  }, []);

  // const [contentRef, setContentRef] = useState(null);
  // const mountNode = contentRef?.contentWindow?.document?.body

  // return (
  //   <div>
  //     <iframe ref={iframeRef} />
  //     {/* <iframe ref={setContentRef}></iframe>
  //     {mountNode && createPortal(children,mountNode)} */}
  //   </div>
  // );
  return null;
}
