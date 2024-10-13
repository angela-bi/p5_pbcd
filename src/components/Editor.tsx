import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { ViewUpdate } from '@codemirror/view';
import {Tooltip, showTooltip} from "@codemirror/view"
import {StateField} from "@codemirror/state"
import {EditorState} from "@codemirror/state"

interface EditorProps {
  code: string;
  onChange: (code: string, viewUpdate: ViewUpdate) => void;
}

export const Editor: React.FC<EditorProps> = ({code, onChange}) => {
  function getCursorTooltips(state: EditorState): readonly Tooltip[] {
    return state.selection.ranges
      .filter(range => range.empty)
      .map(range => {
        let line = state.doc.lineAt(range.head)
        let text = line.number + ":" + (range.head - line.from)
        return {
          pos: range.head,
          above: true,
          strictSide: true,
          arrow: true,
          create: () => {
            let dom = document.createElement("div")
            dom.className = "cm-tooltip-cursor"
            dom.textContent = text
            return {dom}
          }
        }
      })
  }

  const cursorTooltipField = StateField.define<readonly Tooltip[]>({
    create: getCursorTooltips,
  
    update(tooltips, tr) {
      if (!tr.docChanged && !tr.selection) return tooltips
      return getCursorTooltips(tr.state)
    },
  
    provide: f => showTooltip.computeN([f], state => state.field(f))
  })
  
  return (
    <div>
      <CodeMirror value={code} onChange={onChange} />
    </div>
  )
}

