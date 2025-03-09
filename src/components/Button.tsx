import React from 'react'
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { StateObject } from '../App';

interface ButtonProps {
    code: string;
    //startSketch: (ref: StateObject, code: string, cb?: () => void) => StateObject;
    currentEditorCode: string;
    updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void
    stateArray: StateObject[]
    // startSketch: (index: number, code: string) => void
  }

export const Button: React.FC<ButtonProps> = ({ code, currentEditorCode, updateState, stateArray}) => {
  return (
    <div>
        <IconButton aria-label="play" onClick={() => {
          // ref = document.querySelector('iframe')?.contentWindow?.document;
          console.log('button pressed, currentEditorCode: ', currentEditorCode)
          updateState(0, "sketchCode", currentEditorCode)
        }}>
        <PlayArrowIcon/>
        </IconButton>
    </div>
  )
}
