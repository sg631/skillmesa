// ./ImageNode.jsx
import { DecoratorNode } from "lexical";
import React from "react";

export class ImageNode extends DecoratorNode {
  __src;
  __alt;

  constructor({ src, alt }) {
    super();
    this.__src = src;
    this.__alt = alt || "";
  }

  static getType() {
    return "image";
  }

  static clone(node) {
    return new ImageNode({ src: node.__src, alt: node.__alt });
  }

  createDOM() {
    const span = document.createElement("span");
    return span;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <img src={this.__src} alt={this.__alt} style={{ maxWidth: "100%", display: "block" }} />;
  }

  static importJSON(serialized) {
    return new ImageNode(serialized.data || {});
  }

  exportJSON() {
    return {
      type: "image",
      version: 1,
      data: { src: this.__src, alt: this.__alt },
    };
  }
}

export function $createImageNode({ src, alt }) {
  return new ImageNode({ src, alt });
}
