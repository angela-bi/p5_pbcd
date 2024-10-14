import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { ViewUpdate } from '@codemirror/view';
import { Tooltip, showTooltip } from "@codemirror/view";
import { StateField } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
// import { basicSetup } from '@codemirror/basic-setup';

interface EditorProps {
  code: string;
  onChange: (code: string, viewUpdate: ViewUpdate) => void;
}

export const Editor: React.FC<EditorProps> = ({ code, onChange }) => {
  // Function to generate cursor tooltips
  function getCursorTooltips(state: EditorState): readonly Tooltip[] {
    return state.selection.ranges
      .filter(range => range.empty)
      .map(range => {
        let { from, to, text } = state.doc.lineAt(range.head);
        let start = range.head, end = range.head;

        while (start > from && /\w/.test(text[start - from - 1])) start--;
        while (end < to && /\w/.test(text[end - from])) end++;
      
        return {
          pos: start,
          end,
          above: true,
          strictSide: true,
          arrow: true,
          create: () => {
            let dom = document.createElement("div");
            dom.className = "cm-tooltip-cursor";
            dom.textContent = text.slice(start - from, end - from);
            return { dom };
          }
        };
      });
  }

  // Define the cursor tooltip field
  const cursorTooltipField = StateField.define<readonly Tooltip[]>({
    create: getCursorTooltips,

    update(tooltips, tr) {
      if (!tr.docChanged && !tr.selection) return tooltips;
      return getCursorTooltips(tr.state);
    },

    provide: f => showTooltip.computeN([f], state => state.field(f))
  });

  // Define the extensions including the cursor tooltip field
  const extensions = [
    // basicSetup, // Provides basic editor features like line numbers, history, etc.
    cursorTooltipField // Enable the cursor tooltips extension
  ];

  return (
    <div>
      <CodeMirror
        value={code}
        height="300px"
        extensions={extensions} // Attach extensions to the CodeMirror component
        onChange={onChange}
      />
    </div>
  );
};
