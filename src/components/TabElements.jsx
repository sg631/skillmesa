import React, { useState } from "react";
import { Tabs } from "@mantine/core";

/**
 * TabBarElement + TabContainerElement — backward-compatible wrappers
 * around Mantine Tabs.
 *
 * Usage stays the same:
 *   <TabBarElement onTabChange={setActiveTab}>
 *     <li>Tab 1</li>
 *     <li>Tab 2</li>
 *   </TabBarElement>
 *   <TabContainerElement tabIndex={activeTab}>
 *     <li>Panel 1 content</li>
 *     <li>Panel 2 content</li>
 *   </TabContainerElement>
 */

function TabBarElement({ children, width, height, onTabChange }) {
  const liChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === "li"
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleChange = (value) => {
    const idx = parseInt(value, 10);
    setSelectedIndex(idx);
    if (onTabChange) onTabChange(idx);
  };

  return (
    <Tabs
      value={String(selectedIndex)}
      onChange={handleChange}
      variant="default"
      style={{ width: width || "100%", maxWidth: "100%" }}
    >
      <Tabs.List grow>
        {liChildren.map((child, index) => (
          <Tabs.Tab
            key={index}
            value={String(index)}
            onClick={(e) => {
              if (child.props.onClick) child.props.onClick(e);
            }}
          >
            {child.props.children}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

function TabContainerElement({ children, tabIndex = 0, className = "" }) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === "li") {
          return (
            <div
              style={{
                display: index === tabIndex ? "block" : "none",
              }}
            >
              {child.props.children}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export { TabBarElement, TabContainerElement };
