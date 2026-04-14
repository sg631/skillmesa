import React from 'react';
import { Badge, Tooltip } from '@mantine/core';
import { Shield, Crown, Star } from 'lucide-react';

const ROLES = {
  admin: {
    label: 'Skillmesa Admin',
    color: 'cyan',
    icon: <Shield size={11} />,
    tooltip: 'Platform administrator',
  },
  'co-owner': {
    label: 'Co-owner',
    color: 'yellow',
    icon: <Crown size={11} />,
    tooltip: 'Platform co-owner',
  },
  staff: {
    label: 'Staff',
    color: 'teal',
    icon: <Star size={11} />,
    tooltip: 'Skillmesa staff member',
  },
};

/**
 * Shows a platform-role badge for users with admin / co-owner / staff roles.
 * Returns null for regular users (no platformRole or unrecognised value).
 *
 * Props:
 *   role  — value of users/{uid}.platformRole
 *   size  — Mantine Badge size (default 'xs')
 */
export default function PlatformRoleBadge({ role, size = 'xs' }) {
  const config = ROLES[role];
  if (!config) return null;

  return (
    <Tooltip label={config.tooltip} withArrow position="top" openDelay={300}>
      <Badge
        size={size}
        color={config.color}
        variant="light"
        leftSection={config.icon}
        style={{ cursor: 'default' }}
      >
        {config.label}
      </Badge>
    </Tooltip>
  );
}
