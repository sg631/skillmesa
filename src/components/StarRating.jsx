import React, { useState } from 'react';
import { Group, Box } from '@mantine/core';
import { Star, StarHalf } from 'lucide-react';

/**
 * Visual star rating for a 0–5 scale displayed as 5 stars.
 * Decimal values are supported: half-star threshold is at n - 0.5.
 *
 * Props:
 *   value       — numeric rating 0–5 (float for display; 0.5-step for interactive)
 *   size        — icon size in px (default 16)
 *   interactive — enable hover + click picking in 0.5 increments (default false)
 *   onChange    — called with a value in {0.5, 1.0, 1.5, … 5.0} on click
 */
export default function StarRating({ value = 0, size = 16, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || value) : value;

  const lit = 'var(--mantine-color-yellow-5)';
  const dim = 'var(--mantine-color-gray-5)';

  return (
    <Group
      gap={2}
      style={{ userSelect: 'none' }}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map(n => {
        const halfVal = n - 0.5;
        const fullVal = n;
        const full = display >= fullVal;
        const half = !full && display >= halfVal;

        return (
          <Box
            key={n}
            style={{
              position: 'relative',
              display: 'inline-flex',
              cursor: interactive ? 'pointer' : 'default',
            }}
          >
            {/* Invisible left/right click zones for half-star picking */}
            {interactive && (
              <>
                <Box
                  style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 1 }}
                  onMouseEnter={() => setHovered(halfVal)}
                  onClick={() => onChange?.(halfVal)}
                />
                <Box
                  style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 1 }}
                  onMouseEnter={() => setHovered(fullVal)}
                  onClick={() => onChange?.(fullVal)}
                />
              </>
            )}
            {full ? (
              <Star size={size} fill={lit} color={lit} />
            ) : half ? (
              <StarHalf size={size} fill={lit} color={lit} />
            ) : (
              <Star size={size} fill="none" color={dim} />
            )}
          </Box>
        );
      })}
    </Group>
  );
}
