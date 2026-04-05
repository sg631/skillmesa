import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Image } from '@mantine/core';

function LinkButton({ to, className, disabled, children, variant = "default", color, ...rest }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Button
        disabled={disabled}
        variant={variant}
        color={color}
        className={className}
        {...rest}
      >
        {children}
      </Button>
    </Link>
  );
}

function LinkImage({ to, src, width, height, alt, classes }) {
  return (
    <Link to={to} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <Image src={src} alt={alt} w={width} h={height} className={classes} fit="contain" />
    </Link>
  );
}

export { LinkImage, LinkButton };
