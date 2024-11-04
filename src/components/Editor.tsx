import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { ViewUpdate } from '@codemirror/view';
import { Tooltip, showTooltip } from "@codemirror/view";
import { StateField } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
import * as t from "@babel/types";
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';

import checkCommands from '../logic_copy';

interface EditorProps {
  editorCode: string;
  sketchCode: string;
  setEditorCode: (newCode: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ editorCode, setEditorCode }) => {
  // ast code
  const ast = parser.parse(editorCode)
  console.log(ast)

  // generate cursor tooltips
  function getCursorTooltips(state: EditorState): readonly Tooltip[] {
    return state.selection.ranges
      .filter(range => range.empty)
      .map(range => {
        let { from, to, text } = state.doc.lineAt(range.head);
        let start = range.head, end = range.head;

        while (start > from && /\w/.test(text[start - from - 1])) start--;
        while (end < to && /\w/.test(text[end - from])) end++;


        traverse(ast, {
          enter(path) {
            const {node} = path;
            let currentPath = path
            // locate node that is clicked
            if (node.start && node.end && node.start >= start && node.end <= end) {
              if (path.node.type == 'Identifier' ) {
                while (currentPath.parentPath && currentPath.parentPath.type !== 'CallExpression') {
                  currentPath = currentPath.parentPath;
                }
                const argNode = currentPath.node
                const functionNode = currentPath.parentPath?.node
                console.log("Found node where parent path is call expression");
                console.log('param node: ', argNode)
                console.log('function node: ',functionNode)
              }
            }
          },
        });
      
        return {
          pos: start,
          end,
          above: true,
          strictSide: true,
          arrow: true,
          create: () => {
            let dom = document.createElement("div");
            dom.className = "cm-tooltip-cursor";
            console.log(text) // this is the line!
            console.log(from, to)
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
    const currentText = viewUpdate.state.doc.toString();
    setEditorCode(currentText)
  };

  const extensions = [
    cursorTooltipField 
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
