
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

interface EditorProps {
  editorCode: string;
  startSketch: (iframeRef: React.MutableRefObject<HTMLIFrameElement | null>, code: string, cb?: () => void) => void;
  setEditorCode: (newCode: string) => void;
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>
}

export const Editor: React.FC<EditorProps> = ({ editorCode, startSketch, setEditorCode, iframeRefs }) => {

  const mouse_commands = [t.expressionStatement(t.identifier('mouseX')), t.expressionStatement(t.identifier('mouseY'))]
  function perturbParams(paramNode: t.Node) {
    // given a parameter, returns a list of possible variations
    const output = [];
    if (paramNode.type == 'NumericLiteral'){
      console.log('param node is numeric literal!')
      
      for (let c of mouse_commands) {
        output.push(c)
      }
    }
    return output
  }

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
    setEditorCode(currentText)
  };

  const handleClickEvent = (view: EditorView, pos: number, event: MouseEvent) => {
    const state = view.state;
    const doc = state.doc;
    const curr_pos = pos; // the position our mouse clicked
    console.log('new click event called')

    try {
      const ast = parser.parse(editorCode);
      
      traverse(ast, {
        enter(path) {
          const {node} = path;
          let currentPath = path
          // locate node that is clicked
          if (node.start && node.end && node.start <= curr_pos && node.end >= curr_pos) {
            console.log('found node: ', node.start, node.end)
            if (path.node.type == 'NumericLiteral' || path.node.type == 'Identifier') {
              while (currentPath.parentPath && currentPath.parentPath.type !== 'CallExpression') {
                currentPath = currentPath.parentPath;
              }
              const argNode = currentPath.node
              const functionNode = currentPath.parentPath?.node
              console.log('param node before replace: ', argNode)
              console.log('currentPath', currentPath)
              console.log('function node: ',functionNode)
              if (argNode.type == 'NumericLiteral'){
                console.log('trying to replace numeric param')
                currentPath.replaceWith(
                  t.expressionStatement(t.identifier('mouseX'))
                )
              }
              console.log('param node after replace: ', argNode)
              console.log('currentPath after replace: ', currentPath)
              // startSketch(iframeRefs, editorCode)
            }
          }
        },
      });
  
      const output = generate(
        ast,
        {},
        editorCode
      );
      console.log(output)
    } catch (error) {
      // Handle the parsing error
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
        value={editorCode}
        height="300px"
        extensions={extensions}
        onUpdate={handleEditorChange}
      />
    </div>
  );
};
