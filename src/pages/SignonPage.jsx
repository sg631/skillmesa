import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LinkButton } from '../components/LinkElements.jsx';
import SignonComponent from '../components/SignonComponent.jsx';

function SignonPage() {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        
      }}
    >
      <title>sign in | skillmesa</title>
      <SignonComponent width={"60%"} height={"calc(60vh - 75px)"} mode="dual" />
    </div>
  );
}

export default SignonPage;
