import CodeMirror from "@uiw/react-codemirror";
import { langs } from '@uiw/codemirror-extensions-langs'
import * as t from "@babel/types";
import {
  Decoration,
  DecorationSet,
  keymap,
  ViewUpdate,
  Tooltip,
  showTooltip,
  EditorView
} from "@codemirror/view";
import {
  RangeSetBuilder,
  StateEffect,
  StateField,
  EditorState
} from "@codemirror/state";
import { history, historyKeymap, undo, redo } from "@codemirror/commands"; // Import history commands
import { StateObject } from "../App";
import { Loc, perturb } from "../utils/perturb";
import { useRef, useState } from "react";
import { is_param, path_contains_pos } from "../utils/perturb";
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";

interface EditorProps {
  code: string;
  setCurrentEditorCode: React.Dispatch<React.SetStateAction<string>>;
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void
  setNumSketches: React.Dispatch<React.SetStateAction<number[]>>
  setLastClicked: React.Dispatch<React.SetStateAction<number>>
  stateArray: StateObject[]
}

export const Editor: React.FC<EditorProps> = ({ code, setCurrentEditorCode, updateState, setNumSketches, setLastClicked, stateArray }) => {
  const editorViewRef = useRef<EditorView | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(114);
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

  const highlightField = StateField.define<DecorationSet>({
    create() {
      return Decoration.none;
    },

    update(highlights, tr) {
      let builder = new RangeSetBuilder<Decoration>();

      tr.effects.forEach(effect => {
        if (effect.is(highlightEffect)) {
          builder.add(effect.value.from, effect.value.to, highlightMark);
        }
      });

      return builder.finish();
    },

    provide: f => EditorView.decorations.from(f)
  });

  const highlightEffect = StateEffect.define<{ from: number; to: number }>({
    map: (value, mapping) => ({
      from: mapping.mapPos(value.from),
      to: mapping.mapPos(value.to)
    })
  });

  const highlightMark = Decoration.mark({
    attributes: { style: "background-color: rgba(135,206,250, 0.5);" }
  });
  const handleEditorChange = (viewUpdate: ViewUpdate) => {
    const currentText = viewUpdate.state.doc.toString();
    setCurrentEditorCode(currentText);
  };

  const handleUndo = () => {
    if (editorViewRef.current) undo(editorViewRef.current);
  };

  const handleRedo = () => {
    if (editorViewRef.current) redo(editorViewRef.current);
  };

  const handleMouseMove = (view: EditorView, event: MouseEvent) => {
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });

    if (pos !== null) {
      const { from, to, text } = view.state.doc.lineAt(pos);
      let start = pos, end = pos;

      while (start > from && /\w/.test(text[start - from - 1])) start--;
      while (end < to && /\w/.test(text[end - from])) end++;

      view.dispatch({
        effects: highlightEffect.of({ from: start, to: end })
      });
    }
  };


  const handleClickEvent = (view: EditorView, pos: number, event: MouseEvent) => {
    const state = view.state;
    const doc = state.doc;
    const curr_pos = pos; // the position our mouse clicked
    setLastClicked(curr_pos)
    setCursorPosition(curr_pos)
    if (pos !== null) {
      const { from, to, text } = view.state.doc.lineAt(pos);
      let start = pos, end = pos;

      while (start > from && /\w/.test(text[start - from - 1])) start--;
      while (end < to && /\w/.test(text[end - from])) end++;

      view.dispatch({
        effects: highlightEffect.of({ from: start, to: end })
      });
    }

    try {
      const clicked_pos = {start: curr_pos, end: curr_pos} as Loc;
      const { possibleCodes, addedFuncs, lines } = perturb(code, clicked_pos, undefined);
      const numSketches = addedFuncs.filter(x => x.length > 0).map(x => x.length);
      setNumSketches(numSketches);

      let counter = 1
      for (let i = 0; i < possibleCodes.length; i++) {
        for (let j = 0; j < possibleCodes[i].length; j++) {
          updateState(counter, "sketchCode", possibleCodes[i][j])
          updateState(counter, "addedFunction", addedFuncs[i][j])
          updateState(counter+1, 'lineInserted', lines[i][j])
          counter += 1
        }
      }
    } catch (error) {
      // if parsing error
      console.error("Error parsing the code:", error);
    }

  }
  function parseCode(text:string){
    try {
      return parser.parse(text);
    }catch(e){
      const result = (e as Error).message;
      console.log(result)
    }
  }

function setStyle(path: NodePath, decorations: any[]){
    const styleLoc = {
      start: path.node.start!,
      end: path.node.end!
    }
    console.log(styleLoc)
    const highlight_decoration = Decoration.mark({
      attributes: {
          style: `background-color: #f783eb44; opacity: 0.5`
      }
    })
      decorations.push(
        highlight_decoration.range(styleLoc.start,styleLoc.end)
    )
  }
  const highlight_extension = StateField.define<DecorationSet>({
    create() {
        return Decoration.none
    },
    update(_value, transaction) {
        let decorations: any[] = []
        const { state } = transaction
        const text = state.doc.toString()
      
        let ast = parseCode(text)!
        console.log(ast)
        
        traverse(ast, {
          enter(path) {
            if (path_contains_pos(path, {start: cursorPosition, end: cursorPosition})){
              if(is_param(path)){
                setStyle(path,decorations)
              }
              if(t.isCallExpression(path.node)){
                const callee = (path.node as t.CallExpression).callee
                if(callee.start! <= cursorPosition && callee.end! >= cursorPosition){
                  setStyle(path,decorations)
                }
              }
            }
          }})
          return Decoration.set(decorations)
          
    },
    provide: (field) => EditorView.decorations.from(field)
})

  const extensions = [
    // cursorTooltipField,
    highlightField,
    EditorView.domEventHandlers({
      mousemove: (event, view) => handleMouseMove(view, event),
      mousedown: (event, view) => {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos !== null) {
          handleClickEvent(view, pos, event);
        }
      }
    }),
    history(),
    keymap.of(historyKeymap),
    langs.javascript(),
    highlight_extension
  ];

  return (
    <div>
      <CodeMirror
        value={code}
        lang="javascript"
        theme="light"
        height="300px"
        extensions={extensions}
        onUpdate={handleEditorChange}
        onCreateEditor={(view) => (editorViewRef.current = view)}
        basicSetup={{
          dropCursor: false,
        }}
      />
    </div>
  );
};
