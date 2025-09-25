import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LinkButton } from '../components/LinkElements.jsx';

function NotFoundPage() {
  return (
    <>
      <title>uh-oh! 404 | skillmesa</title>
      <h1>
        <span className="textgiant">Uh-oh!</span>
        <br></br>
        <span className="textlarge">404: Page Not Found</span>
        <br></br>
        <span className="textmedium">We couldn't find the page you were looking for.</span>
      </h1>
      <LinkButton to="/home" className="textcenter">Go Back</LinkButton>
    </>
  );
}

export default NotFoundPage;