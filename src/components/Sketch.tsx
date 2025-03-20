import React, { useEffect, useRef, useState } from 'react';
import { StateObject } from '../App';
import * as t from "@babel/types";
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from "@babel/generator";
import { ConstructorNames, ModifierNames, CommandName, InsertDirection, Command, checkValidity, checkCommands, getCommand } from '../utils/check_commands'
import { perturb } from '../utils/perturb';
import { format } from '../utils/format';
import CodeMirror from "@uiw/react-codemirror";
import { langs } from '@uiw/codemirror-extensions-langs'
import {
  Decoration,
  DecorationSet,
  keymap,
  ViewUpdate,
  Tooltip,
  showTooltip,
  EditorView
} from "@codemirror/view";


interface SketchProps {
  state: StateObject;
  code: string;
  updateState: <K extends keyof StateObject>(index: number, key: K, value: StateObject[K]) => void;
  stateArray: StateObject[];
  setNumSketches: React.Dispatch<React.SetStateAction<number[]>>
  setLastClicked: React.Dispatch<React.SetStateAction<number>>
  lastClicked: number;
}

export const Sketch: React.FC<SketchProps> = ({ state, code, updateState, stateArray, setNumSketches, setLastClicked, lastClicked }) => {
  const [dims, setDims] = useState<string[]>(['320px', '320px']);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleClick = () => { // find out how to log what was clicked
    try {
      updateState(0, "sketchCode", code);
    } catch (e) {
      console.error('couldnt update state', e)
    }

    // const { possibleCodes, addedFuncs, lines } = perturb(code, state.lineInserted!);
    // const numSketches = addedFuncs.filter(x => x.length > 0).map((x) => x.length);
    // setNumSketches(numSketches);

    // let counter = 0
    // for (let i = 0; i < possibleCodes.length; i++) {
    //   for (let j = 0; j < possibleCodes[i].length; j++) {
    //     updateState(counter + 1, "sketchCode", possibleCodes[i][j])
    //     updateState(counter + 1, "addedFunction", addedFuncs[i][j])
    //     updateState(counter + 1, 'lineInserted', lines[i][j])
    //     counter += 1
    //   }
    // }
  };

  const generateSrcDoc = (sketch: string) => {
    return `
    <!doctype html>
      <head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.0/p5.min.js" onerror="function() {alert('Error loading ' + this.src);};"></script>
        <style>
          body {
            margin: 0;
            overflow: hidden;
          }
          .selectable {
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <script>
          ${sketch}
        </script>
      </body>
    <html>`
  }

  let src_code = generateSrcDoc(state.sketchCode)

  function getHighlightedText(text: string, highlight: string) {
    // Split text on highlight term, include term itself into parts, ignore case
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return <span>{parts.map(part => part.toLowerCase() === highlight.toLowerCase() ? <b>{part}</b> : part)}</span>;
  }

  return (
    <div className="sketch" onClick={handleClick}>
      <div className="iframe-wrapper">
        <iframe
          onLoad={(e) => {
            const iframe = e.currentTarget;
            const w = iframe.contentWindow!;

            if (iframe.closest(".sketch-row") == null) {
              (window as any).sketch = w;
            }

            w.onclick = function () { handleClick() };

            w.onerror = function (message) {
              console.log(
                `%cRuntime error:%c ${message}`,
                "color: #CC0000; font-weight: bold",
                "color: #CC0000; font-weight: normal",
              );
            };

            if (w.document.body) {
              const width = w.document.body.scrollWidth;
              const height = w.document.body.scrollHeight - 6;

              iframe.style.width = width + "px";
              iframe.style.height = height + "px";
              

              const desiredWidth = 150; // in px

              const factor = desiredWidth / width;

              document.querySelectorAll(".sketch-row .sketch iframe").forEach((el: any) => {
                  el.style.transform = `scale(${factor}, ${factor})`;
              });

              document.querySelectorAll(".sketch-row .iframe-wrapper").forEach((el: any) => {
                el.style.width = (width * factor) + "px";
                el.style.height = (height * factor) + "px";
              });

              document.querySelectorAll(".sketch-row .sketch").forEach((el: any) => {
                el.style.width = (width * factor) + "px";
              });

              if (state.addedFunction) {
                w.document.body.classList.add("selectable");
              }
            }
          }}
          srcDoc={src_code}
          title={state.addedFunction}
        />
      </div>
      {state.addedFunction &&
        <h4 className="added-function">
          {format(state.addedFunction)}
        </h4>
      }
    </div>
  );
};
