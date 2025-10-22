import React, { useState, useEffect, useRef } from "react";

// ✅ Tab Bar Component
function TabBarElement({ children, width, height, onTabChange }) {
    const liChildren = React.Children.toArray(children).filter(
        (child) => React.isValidElement(child) && child.type === "li"
    );

    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        // Auto-select first tab if at least one exists
        if (liChildren.length > 0 && selectedIndex >= liChildren.length) {
            setSelectedIndex(0);
        }
    }, [liChildren.length]);

    const handleTabClick = (index, child, e) => {
        setSelectedIndex(index);
        if (child.props.onClick) child.props.onClick(e);
        if (onTabChange) onTabChange(index);
    };

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
                {liChildren.map((child, index) => (
                    <button
                        key={index}
                        onClick={(e) => handleTabClick(index, child, e)}
                        className={`tab-button ${
                            selectedIndex === index ? "tab-button-selected" : ""
                        }`}
                    >
                        {child.props.children}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ✅ Tab Container Component
function TabContainerElement({ children, tabIndex = 0, className = "" }) {
    const containerRef = useRef(null);

    return (
        <div ref={containerRef} className={`tab-container ${className}`}>
            {React.Children.map(children, (child, index) => {
                if (React.isValidElement(child) && child.type === "li") {
                    return React.cloneElement(child, {
                        style: {
                            ...(child.props.style || {}),
                            display: index === tabIndex ? "block" : "none",
                        },
                    });
                }
                return null;
            })}
        </div>
    );
}

export { TabBarElement, TabContainerElement };
