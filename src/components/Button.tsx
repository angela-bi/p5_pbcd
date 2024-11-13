import React from 'react'
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { ViewUpdate } from '@codemirror/view';

interface ButtonProps {
    sketchCode: string;
    editorCode: string;
    setSketchCode: (newCode: string) => void;
    startSketch: (iframeRef: React.MutableRefObject<HTMLIFrameElement | null>, code: string, cb?: () => void) => void;
    iframeRef: React.MutableRefObject<HTMLIFrameElement | null>;
  }

export const Button: React.FC<ButtonProps> = ({ sketchCode, editorCode, setSketchCode, startSketch, iframeRef}) => {
  return (
    <div>
        <IconButton aria-label="play" onClick={() => {
          // ref = document.querySelector('iframe')?.contentWindow?.document;
          if (iframeRef.current) {
            setSketchCode(editorCode);
            startSketch(iframeRef, editorCode); // Call `startSketch` with the iframe ref and code
          }
        }}>
        <PlayArrowIcon/>
        </IconButton>
    </div>
  )
}
