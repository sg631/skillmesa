import React from 'react';
import { Link } from 'react-router-dom';

// Button that acts as a link
function LinkButton({ to, children }) {
    return (
        <Link to={to} className='link-button'>
            <button>
                {children}
            </button>
        </Link>
    );
}
function LinkImage({ to, src, width, height, alt }) {
    return (
        <Link to={to} className='link-image'>
            <img src={src} alt={alt} width={width} height={height}/>
        </Link>
    );
}

// Exporting the components
export { LinkImage, LinkButton };