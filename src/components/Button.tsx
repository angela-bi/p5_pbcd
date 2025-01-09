import React from 'react'
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { ViewUpdate } from '@codemirror/view';
import { StateObject } from '../App';

interface ButtonProps {
    code: string;
    //startSketch: (ref: StateObject, code: string, cb?: () => void) => StateObject;
    currentEditorCode: string;
    updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void
  }

export const Button: React.FC<ButtonProps> = ({ code, currentEditorCode, updateState}) => {
  return (
    <div>
        <IconButton aria-label="play" onClick={() => {
          // ref = document.querySelector('iframe')?.contentWindow?.document;
          updateState(0, "sketchCode", currentEditorCode)
        }}>
        <PlayArrowIcon/>
        </IconButton>
    </div>
  )
}
