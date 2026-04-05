import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Transition, Box } from "@mantine/core";

const fadeUp = {
  in:  { opacity: 1, transform: 'translateY(0)' },
  out: { opacity: 0, transform: 'translateY(8px)' },
  common: {},
  transitionProperty: 'opacity, transform',
};

export default function PageTransition({ children }) {
  const location = useLocation();
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <Transition
      mounted={mounted}
      transition={fadeUp}
      duration={260}
      timingFunction="cubic-bezier(0.22, 1, 0.36, 1)"
    >
      {(styles) => (
        <Box style={{ ...styles, width: '100%' }}>
          {children}
        </Box>
      )}
    </Transition>
  );
}
