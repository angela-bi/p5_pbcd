import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { ViewUpdate } from '@codemirror/view';
import { Tooltip, showTooltip } from "@codemirror/view";
import { StateField } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
// import { basicSetup } from '@codemirror/basic-setup';

interface EditorProps {
  editorCode: string;
  sketchCode: string;
  setEditorCode: (newCode: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ editorCode, setEditorCode }) => {
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
            //console.log(text) // this is the line!
            //console.log(from, to)
            dom.textContent = text.slice(start - from, end - from); // this is the specific part a user is hovering over - individual args
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

  const handleEditorChange = (viewUpdate: ViewUpdate) => {
    const currentText = viewUpdate.state.doc.toString(); // Get the current content of the editor
    setEditorCode(currentText)
    console.log('Current text in editor:', currentText);
  };

  // Define the extensions including the cursor tooltip field
  const extensions = [
    // basicSetup, // Provides basic editor features like line numbers, history, etc.
    cursorTooltipField // Enable the cursor tooltips extension
  ];

  return (
    <div>
      <CodeMirror
        value={editorCode}
        height="300px"
        extensions={extensions}
        onUpdate={handleEditorChange}
      />
    </div>
  );
};
