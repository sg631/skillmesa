import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LinkButton } from '../components/LinkElements.jsx';

function ComingSoonPage() {
  return (
    <>
      <title>coming soon | skillmesa</title>
      <h1>
        <span className="textgiant">Coming Soon</span>
        <br></br>
        <span className="textmedium">Making things better..</span>
        <br></br>
        <span className="textsmall">This page is a work in progress (or in active development). Check again later.</span>
      </h1>
      <LinkButton to="/home" className="textcenter">Okay!</LinkButton>
    </>
  );
}

export default ComingSoonPage;