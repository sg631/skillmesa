"use client";
import { Excalidraw, convertToExcalidrawElements } from "@excalidraw/excalidraw";

import "@excalidraw/excalidraw/index.css";
import "../pages/styles/2d-buttons.css"

function WhiteboardComponent() {
  console.info(convertToExcalidrawElements([{
    type: "rectangle",
    id: "rect-1",
    width: 186.47265625,
    height: 141.9765625,
  },]));
  return (
    <div className="excalidrawWrapper" style={{height:"1000px", width:"700px"}}>
      <Excalidraw />
    </div>
  );
};
export default WhiteboardComponent;