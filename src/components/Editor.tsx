import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { ViewUpdate } from '@codemirror/view';

interface EditorProps {
  code: string;
  setCode: (newCode: string) => void;
}

export const Editor: React.FC<EditorProps> = ({code, setCode}) => {
  const onChange = React.useCallback((code: string, viewUpdate: ViewUpdate) => {
    setCode(code);
  }, []);

  return (
    <div>
      <CodeMirror value={code} onChange={onChange} />
    </div>
  )
}

