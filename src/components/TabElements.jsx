import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";


//Tab Bar. Can be used to switch between different sections or modes, doesn't have to be a tab bar.
//This component is a simple tab chooser that allows you to switch between different sections or modes.
//It can be used in various contexts, such as a sign-up/login switch, or any other tabbed interface.
//It automatically selects the first tab (index = 1) if there is at least one tab.
//It also allows you to specify the width and height of the tab bar.

function TabBarElement({ children, width, height }) {
    const liChildren = React.Children.toArray(children).filter(
        (child) => React.isValidElement(child) && child.type === "li"
    );

    // Auto-select first tab (index = 1) if there is at least one tab
    const [selectedIndex, setSelectedIndex] = useState(
        liChildren.length > 0 ? 1 : 0
    );

    useEffect(() => {
        // If children change, reselect first tab
        if (liChildren.length > 0 && selectedIndex === 0) {
            setSelectedIndex(1);
        }
    }, [children]);

    return (
        <div
            className="tab-chooser-element"
            data-button-selected={selectedIndex}
            style={{ width, height }}
        >
            <style>{`
                .tab-chooser-element {
                    background-color: #ffffff;
                    color: #333333;
                    font-family: inherit;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: ${width || "100%"};
                    height: ${height || "50px"};
                    border-radius: 10px;
                    z-index: 1000;
                    max-width: 100%;
                }
                .tab-buttons {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    justify-content: left;
                    align-items: center;
                    gap: 10px;
                }
                .tab-button {
                    background-color: transparent;
                    border: none;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }
            `}</style>

            <div className="tab-buttons">
                {liChildren.map((child, index) => {
                    const btnIndex = index + 1; // start from 1
                    return (
                        <button
                            key={index}
                            onClick={(e) => {
                                setSelectedIndex(btnIndex);
                                if (child.props.onClick) {
                                    child.props.onClick(e);
                                }
                            }}
                            className={`tab-button ${
                                selectedIndex === btnIndex ? "tab-button-selected" : ""
                            }`}
                        >
                            {child.props.children}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Container for tabs, simply displays the li child specified by the data-display-index attribute.
// This is useful for displaying the content of the selected tab.
// Typically used in conjunction with TabBarElement to show the content of the selected tab,
// but can also be used independently for different purposes.

function TabContainerElement({ children, ...props }) {
    const containerRef = useRef(null);
    const [tabIndex, setTabIndex] = useState(() => {
        const initial = parseInt(props["data-tab-index"], 10);
        return Number.isInteger(initial) ? initial : 0;
    });

    // Keep React state in sync if prop changes
    useEffect(() => {
        const newIndex = parseInt(props["data-tab-index"], 10);
        if (!isNaN(newIndex)) {
            setTabIndex(newIndex);
        }
    }, [props["data-tab-index"]]);

    // Watch for DOM attribute/property changes
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Watch data-tab-index attribute changes
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "data-tab-index"
                ) {
                    const newIndex = parseInt(el.getAttribute("data-tab-index"), 10);
                    if (!isNaN(newIndex)) {
                        setTabIndex(newIndex);
                    }
                }
            }
        });

        observer.observe(el, { attributes: true });

        // Patch dataset.tabIndex to trigger re-render
        const desc = Object.getOwnPropertyDescriptor(el.dataset.__proto__, "tabIndex");
        if (desc && desc.set) {
            Object.defineProperty(el.dataset, "tabIndex", {
                ...desc,
                set(value) {
                    desc.set.call(this, value);
                    const newIndex = parseInt(value, 10);
                    if (!isNaN(newIndex)) {
                        setTabIndex(newIndex);
                    }
                },
            });
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} {...props} className={`tab-container${props.className ? " " + props.className : ""}`} data-tab-index={tabIndex}>
            {React.Children.map(children, (child, index) => {
                if (React.isValidElement(child) && child.type === "li") {
                    return React.cloneElement(child, {
                        style: {
                            ...(child.props.style || {}),
                            display: index === tabIndex ? "" : "none",
                        },
                    });
                }
                return null;
            })}
        </div>
    );
}

export { TabBarElement, TabContainerElement };
