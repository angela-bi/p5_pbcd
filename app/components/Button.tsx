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

export const Button: React.FC<ButtonProps> =
    ({ code, currentEditorCode, updateState, stateArray}) => {
        return (
            <button className="run-button" onClick={() => {
                updateState(0, "sketchCode", currentEditorCode)
            }}>
                ▶
            </button>
        )
}
