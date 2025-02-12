
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
import { ConstructorNames, ModifierNames, CommandName, InsertDirection, Command, checkValidity, checkCommands, createCommand } from '../logic_copy'
import perturb_params from '../perturb_params';

const circle = {name: "circle", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 3} as Command
const ellipse = {name: "ellipse", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 4} as Command // it can have 3 or 4
const fill = {name: "fill", valid: ["circle", "ellipse"], invalid: [], default_valid: false, kind: "Modifier", direction: "Above", num_params: 3} as Command
const beginShape = {name: "beginShape", valid: [], invalid: ["vertex", "beginShape"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 0} as Command // since it's only a hoverCommand
const vertex = {name: "vertex", valid: ["vertex"], invalid: [], default_valid: false, kind: "Constructor", direction: "Below", num_params: 0} as Command

interface EditorProps {
  startSketch: (state: StateObject, code: string) => StateObject;
  code: string;
  refs: StateObject[];
  setCurrentEditorCode: React.Dispatch<React.SetStateAction<string>>;
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void
  userClicked: boolean;
  setUserClicked: React.Dispatch<React.SetStateAction<boolean>>
}

export const Editor: React.FC<EditorProps> = ({ startSketch, code, refs, setCurrentEditorCode, updateState, setUserClicked }) => {
  let commands = [circle, ellipse, fill, beginShape, vertex]

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
  function perturbParam(editorCode: string, curr_pos: number) {
    let output = '';
    const ast = parser.parse(editorCode);
      
    traverse(ast, {
      enter(path) {
        const {node} = path;
        let currentPath = path
        // locate node that is clicked
        if (node.start && node.end && node.start <= curr_pos && node.end >= curr_pos) {
          if (path.node.type == 'NumericLiteral' || path.node.type == 'Identifier') {
            while (currentPath.parentPath && currentPath.parentPath.type !== 'CallExpression') {
              currentPath = currentPath.parentPath;
            }
            currentPath = currentPath.parentPath!;
            console.log('currentPath:', currentPath)
            if ( t.isCallExpression(currentPath.node) && currentPath.node.arguments.every((node) => t.isNode(node))) {
              console.log("currentPath:", currentPath);
    
              // Modify function arguments safely
              let newArgs = currentPath.node.arguments.map(() =>
                t.identifier('mouseX') // hard coded, replace later
              );
    
    
              // Replace the function arguments directly
              currentPath.replaceWith(
                t.callExpression(currentPath.node.callee, newArgs)
              );

              console.log('currentPath after change: ', currentPath)
            }
          }
        }
      },
    });

    output = generate(ast, {}, editorCode).code;
    return output
  }

  function perturbFunc(editorCode: string, curr_pos: number) {
    let possible_code = [] as string[];
    let added_funcs = [] as string[];
    const ast = parser.parse(editorCode);
    console.log('editorCode: ', editorCode)
    console.log('ast: ', ast)
  
    traverse(ast, {
      enter(path) {
        const { node } = path;
        let currentPath = path;
  
        if (node.start && node.end && node.start <= curr_pos && node.end >= curr_pos) {
          if (path.node.type === 'NumericLiteral' || path.node.type === 'Identifier') {
            while (currentPath.parentPath && currentPath.parentPath.node.type !== 'CallExpression') {
              currentPath = currentPath.parentPath;
            }
  
            const funcNode = currentPath.parentPath?.node;
            if (
              funcNode &&
              funcNode.type === 'CallExpression' &&
              funcNode.callee.type === 'Identifier'
            ) {
              const func = createCommand(funcNode.callee.name, commands);
              if (func && currentPath.parentPath) {
                const insertDirections = checkCommands(func, commands);
  
                for (let i = 0; i < insertDirections.length; i++) {
                  if (insertDirections[i] !== null) {
                    const clonedAst = JSON.parse(JSON.stringify(ast));
  
                    const clonedPath = traverse(clonedAst, {
                      enter(clonedPath) {
                        if (clonedPath.node.start === currentPath.node.start &&
                            clonedPath.node.end === currentPath.node.end) {
                          clonedPath.stop(); // Stop traversal once the target node is found
                          const clonedParentPath = clonedPath.parentPath;
  
                          const callee = t.identifier(commands[i].name);
                          const params = [] as t.Expression[];
                          for (let j = 0; j < commands[i].num_params; j++) {
                            params.push(t.numericLiteral(100)) // for now, hard coded
                          }                          
                          const callExpression = t.callExpression(callee, params);
  
                          if (insertDirections[i] === 'Above' && clonedParentPath) {
                            clonedParentPath.insertBefore(callExpression);
                          } else if (insertDirections[i] === 'Below' && clonedParentPath) {
                            clonedParentPath.insertAfter(callExpression);
                          }
                          added_funcs.push(generate(callExpression).code)
                        }
                      },
                    });
  
                    const output = generate(clonedAst, {}, editorCode).code;
                    possible_code.push(output);

                  }
                }
              }
            }
          }
        }
      },
    });  
    return {possible_code, added_funcs};
  }

  const handleClickEvent = (view: EditorView, pos: number, event: MouseEvent) => {
    setUserClicked(true);
    const state = view.state;
    const doc = state.doc;
    const curr_pos = pos; // the position our mouse clicked

    try {
      let possible_code = null;
      let added_funcs = null;
      ({ possible_code, added_funcs } = perturbFunc(code, curr_pos));
      console.log(perturbParam(code, curr_pos))
      
      for (let i = 1; i < refs.length; i++) {
        try {
          updateState(i, "sketchCode", possible_code[i]);
          updateState(i, "addedFunction", added_funcs[i])
        } catch (e) {
          console.error("Error parsing the code:", e)
        }
      }
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
