
import CodeMirror from '@uiw/react-codemirror';
import { Decoration, DecorationSet, ViewUpdate } from '@codemirror/view';
import { Tooltip, showTooltip, EditorView } from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
import * as t from "@babel/types";
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from "@babel/generator";
import { StateObject } from "../App";
import { ConstructorNames, ModifierNames, CommandName, InsertDirection, Command, checkValidity, checkCommands, createCommand } from '../utils/check_commands'
import { perturbFunc } from '../utils/perturb';

const circle = {name: "circle", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 3} as Command
const ellipse = {name: "ellipse", valid: [], invalid: ["vertex"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 4} as Command // it can have 3 or 4
const fill = {name: "fill", valid: ["circle", "ellipse"], invalid: [], default_valid: false, kind: "Modifier", direction: "Above", num_params: 3} as Command
const beginShape = {name: "beginShape", valid: [], invalid: ["vertex", "beginShape"], default_valid: true, kind: "Constructor", direction: "Below", num_params: 0} as Command // since it's only a hoverCommand
const vertex = {name: "vertex", valid: ["vertex"], invalid: [], default_valid: false, kind: "Constructor", direction: "Below", num_params: 0} as Command

interface EditorProps {
  code: string;
  setCurrentEditorCode: React.Dispatch<React.SetStateAction<string>>;
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void
  userClicked: boolean;
  setUserClicked: React.Dispatch<React.SetStateAction<boolean>>
  setNumSketches: React.Dispatch<React.SetStateAction<number[]>>
}

export const Editor: React.FC<EditorProps> = ({ code, setCurrentEditorCode, updateState, setUserClicked, setNumSketches }) => {
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

  const cursorTooltipField = StateField.define<readonly Tooltip[]>({
    create: getCursorTooltips,

    update(tooltips, tr) {
      if (!tr.docChanged && !tr.selection) return tooltips;
      return getCursorTooltips(tr.state);
    },

    provide: f => showTooltip.computeN([f], state => state.field(f))
  });

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
    attributes: { style: "background-color: rgba(255, 255, 0, 0.5);" }
  });
  const handleEditorChange = (viewUpdate: ViewUpdate) => {
    const currentText = viewUpdate.state.doc.toString();
    setCurrentEditorCode(currentText);
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
    setUserClicked(true);
    const state = view.state;
    const doc = state.doc;
    const curr_pos = pos; // the position our mouse clicked

    try {
      const { possibleCodes, addedFuncs } = perturbFunc(code, curr_pos, commands, undefined);
      console.log(addedFuncs)
      const numSketches = addedFuncs.filter(x => x.length > 0).map(x => x.length);
      setNumSketches(numSketches);

      let counter = 1
      for (let i = 0; i < possibleCodes.length; i++) {
        for (let j = 0; j < possibleCodes[i].length; j++) {
          updateState(counter, "sketchCode", possibleCodes[i][j])
          updateState(counter, "addedFunction", addedFuncs[i][j])
          counter += 1
        }
      }
    } catch (error) {
      // if parsing error
      console.error("Error parsing the code:", error);
    }

  }

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
