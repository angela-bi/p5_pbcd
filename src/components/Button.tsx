import React from 'react'
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { ViewUpdate } from '@codemirror/view';

interface ButtonProps {
    sketchCode: string;
    editorCode: string;
    setSketchCode: (newCode: string) => void;
    startSketch: (sketchCode:string, editorCode:string, dom: Document ) => void;
  }

export const Button: React.FC<ButtonProps> = ({ sketchCode, editorCode, setSketchCode, startSketch}) => {
  return (
    <div>
        <IconButton aria-label="play" onClick={() => {
            // setSketchCode(editorCode)
            const iframeDoc = document.querySelector('iframe')?.contentWindow?.document; // Get the iframe document
                if (iframeDoc) {
                    startSketch(sketchCode, editorCode, iframeDoc); // Call startSketch with code and iframe document
                }
        }}>
        <PlayArrowIcon/>
        </IconButton>
    </div>
  )
}
