import React from 'react';
import { Link } from 'react-router-dom';

// Button that acts as a link
function LinkButton({ to, className, disabled, children }) {
    return (
        <Link to={to} className='link-button'>
            <button disabled={disabled} className={className}>
                {children}
            </button>
        </Link>
    );
}
function LinkImage({ to, src, width, height, alt, classes}) {
    return (
        <Link to={to} className='link-image'>
            <img src={src} alt={alt} width={width} height={height} className={classes} />
        </Link>
    );
}

// Exporting the components
export { LinkImage, LinkButton };