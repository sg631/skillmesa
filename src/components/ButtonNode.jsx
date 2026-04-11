import { DecoratorNode } from "lexical";
import React from "react";

export class ButtonNode extends DecoratorNode {
  __label;
  __href;

  constructor(label, href, key) {
    super(key);
    this.__label = label || "Button";
    this.__href = href || "";
  }

  static getType() {
    return "button";
  }

  static clone(node) {
    return new ButtonNode(node.__label, node.__href, node.__key);
  }

  createDOM() {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    return span;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    const style = {
      display: "inline-block",
      padding: "8px 18px",
      borderRadius: 8,
      background: "var(--mantine-color-cyan-6)",
      color: "#fff",
      fontWeight: 600,
      fontSize: 14,
      textDecoration: "none",
      cursor: "pointer",
      userSelect: "none",
    };
    if (this.__href) {
      return (
        <a href={this.__href} target="_blank" rel="noopener noreferrer" style={style}>
          {this.__label}
        </a>
      );
    }
    return <span style={style}>{this.__label}</span>;
  }

  static importJSON(serialized) {
    const { label, href } = serialized.data || {};
    return new ButtonNode(label, href);
  }

  exportJSON() {
    return {
      type: "button",
      version: 1,
      data: { label: this.__label, href: this.__href },
    };
  }
}

export function $createButtonNode(label, href) {
  return new ButtonNode(label, href);
}
