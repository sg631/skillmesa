import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function CarouselElement({ children, interval = 3000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const location = useLocation();
    const timeoutRef = useRef(null);

    // Separate li elements from everything else
    const liItems = React.Children.toArray(children).filter(
        (child) => React.isValidElement(child) && child.type === "li"
    );
    const otherChildren = React.Children.toArray(children).filter(
        (child) => !(React.isValidElement(child) && child.type === "li")
    );

    // Reset on route change
    useEffect(() => {
        setCurrentIndex(0);
    }, [location]);

    // Auto slide
    useEffect(() => {
        timeoutRef.current = setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, interval);
        return () => clearTimeout(timeoutRef.current);
    }, [currentIndex, interval]);

    // Loop handling
    useEffect(() => {
        if (currentIndex === liItems.length) {
            const transitionDuration = 500; // match CSS transition
            const resetTimer = setTimeout(() => {
                setIsTransitioning(false);
                requestAnimationFrame(() => {
                    setCurrentIndex(0);
                    requestAnimationFrame(() => {
                        setIsTransitioning(true);
                    });
                });
            }, transitionDuration);
            return () => clearTimeout(resetTimer);
        }
    }, [currentIndex, liItems.length]);

    return (
        <div className="carousel-element">
            <style>{`
                .carousel-element {
                    position: relative;
                    display: inline-block;
                    overflow: hidden;
                    vertical-align: middle;
                }
                .carousel-element ul {
                    display: flex;
                    padding: 0;
                    margin: 0;
                    transition: ${isTransitioning ? "transform 0.5s ease-in-out" : "none"};
                    transform: translateX(-${currentIndex * 100}%);
                    list-style: none;
                }
                .carousel-element li {
                    flex: 0 0 100%;
                    box-sizing: border-box;
                }
            `}</style>

            {/* Non-li children stay as normal */}
            {otherChildren}

            {/* Carousel uses only the <li> elements */}
            {liItems.length > 0 && (
                <ul>
                    {liItems}
                    {/* clone first slide for seamless loop */}
                    <li key="clone">{liItems[0]}</li>
                </ul>
            )}
        </div>
    );
}

export default CarouselElement;
