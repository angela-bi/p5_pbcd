
import { MutableRefObject } from "react"
import CodeMirror from '@uiw/react-codemirror';
import { ViewUpdate } from '@codemirror/view';
import { Tooltip, showTooltip, EditorView } from "@codemirror/view";
import { StateField } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
import * as t from "@babel/types";
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from "@babel/generator";
import { StateObject } from "../App";

interface EditorProps {
  startSketch: (ref: StateObject, code: string, cb?: () => void) => void;
  code: string;
  refs: StateObject[];
  setCurrentEditorCode: React.Dispatch<React.SetStateAction<string>>;
}

export const Editor: React.FC<EditorProps> = ({ startSketch, code, refs, setCurrentEditorCode }) => {

  // generate cursor tooltips
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
    setCurrentEditorCode(currentText);
  };

  const params = [t.expressionStatement(t.identifier('mouseX')), t.expressionStatement(t.identifier('mouseY'))]
  function perturbParam(expression: t.ExpressionStatement, editorCode: string, curr_pos: number) {
    let output = '';
    const ast = parser.parse(editorCode);
      
    traverse(ast, {
      enter(path) {
        const {node} = path;
        let currentPath = path
        // locate node that is clicked
        if (node.start && node.end && node.start <= curr_pos && node.end >= curr_pos) {
          //console.log('found node: ', node.start, node.end)
          if (path.node.type == 'NumericLiteral' || path.node.type == 'Identifier') {
            while (currentPath.parentPath && currentPath.parentPath.type !== 'CallExpression') {
              currentPath = currentPath.parentPath;
            }
            const argNode = currentPath.node
            if (argNode.type == 'NumericLiteral'){ // for now, change later
              currentPath.replaceWith(expression)
            }
          }
        }
      },
    });

    output = generate(ast, {}, editorCode).code;
    return output
  }

  function perturbFunc(editorCode: string, curr_pos: number) {
    let output = '';
    const ast = parser.parse(editorCode);
      
    traverse(ast, {
      enter(path) {
        const {node} = path;
        let currentPath = path
        // locate node that is clicked
        if (node.start && node.end && node.start <= curr_pos && node.end >= curr_pos) {
          //console.log('found node: ', node.start, node.end)
          if (path.node.type == 'NumericLiteral' || path.node.type == 'Identifier') {
            while (currentPath.parentPath && currentPath.parentPath.type !== 'CallExpression') {
              currentPath = currentPath.parentPath;
            }
            const argNode = currentPath.node
            const funcNode = currentPath.parentPath!.node
            if (currentPath.parentPath){
              //currentPath.parentPath.replaceWith(t.callExpression(currentPath.parentPath.node.arguments))
              // here is where we should use validFunc
            }
          }
        }
      },
    });

    output = generate(ast, {}, editorCode).code;
    return output
  }

  const handleClickEvent = (view: EditorView, pos: number, event: MouseEvent) => {
    const state = view.state;
    const doc = state.doc;
    const curr_pos = pos; // the position our mouse clicked
    //console.log('new click event called')

    try {
      const output = perturbFunc(code, curr_pos)
      // here is where we should modify the state arrays
      // create a list of perturbed functions + fill in arrays 1..n-1 with it
    } catch (error) {
      // if parsing error
      console.error("Error parsing the code:", error);
    }

  }

  const extensions = [
    cursorTooltipField,
    EditorView.domEventHandlers({
      mousedown: (event, view) => {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos !== null) {
          handleClickEvent(view, pos, event);
        }
      }
    })
  ];

  return (
    <div>
      <CodeMirror
        value={code}
        height="300px"
        extensions={extensions}
        onUpdate={handleEditorChange}
      />
    </div>
  );
};
