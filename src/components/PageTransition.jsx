import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Transition, Box } from "@mantine/core";

export default function PageTransition({ children }) {
  const location = useLocation();
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    setMounted(false);
    const timeout = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <Transition
      mounted={mounted}
      transition="fade"
      duration={400}
      timingFunction="ease"
    >
      {(styles) => (
        <Box style={styles}>
          {children}
        </Box>
      )}
    </Transition>
  );
}
