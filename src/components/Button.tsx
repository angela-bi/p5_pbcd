import React from 'react'
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { ViewUpdate } from '@codemirror/view';

interface ButtonProps {
    code: string;
    setCode: (newCode: string) => void;
    onChange: (code: string, viewUpdate: ViewUpdate) => void;
  }

export const Button: React.FC<ButtonProps> = ({ code, setCode, onChange}) => {
  return (
    <div>
        <IconButton aria-label="play" >
        <PlayArrowIcon />
        </IconButton>
    </div>
  )
}
