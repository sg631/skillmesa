import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();
  const [isFading, setIsFading] = useState(true);

  useEffect(() => {
    // Trigger fade in whenever route changes
    setIsFading(true);
    const timeout = setTimeout(() => setIsFading(false), 500); // matches animation duration

    return () => clearTimeout(timeout);
  }, [location]);

  const pageStyle = {
    animation: isFading ? "fadeInDown 0.5s ease-out" : "none",
  };

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes fadeInDown {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {children}
    </div>
  );
}