
import CodeMirror from '@uiw/react-codemirror';
import { Decoration, DecorationSet, keymap, ViewUpdate } from '@codemirror/view';
import { Tooltip, showTooltip, EditorView } from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
import { StateObject } from "../App";
import { Loc, perturb } from '../utils/perturb';
import { history, historyKeymap, undo, redo } from "@codemirror/commands"; // Import history commands
import { useRef } from 'react';

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

  // for tooltip functionality - not currently
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
      console.log('lines: ',lines)
      console.log(possibleCodes)
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
    keymap.of(historyKeymap)
  ];

  return (
    <div>
      <CodeMirror
        value={code}
        height="300px"
        extensions={extensions}
        onUpdate={handleEditorChange}
        onCreateEditor={(view) => (editorViewRef.current = view)}
      />
    </div>
  );
};
