import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { ViewUpdate } from '@codemirror/view';

interface EditorProps {
  code: string;
  onChange: (code: string, viewUpdate: ViewUpdate) => void;
}

export const Editor: React.FC<EditorProps> = ({code, onChange}) => {

  return (
    <div>
      <CodeMirror value={code} onChange={onChange} />
    </div>
  )
}

