import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LinkButton } from '../components/LinkElements.jsx';
import { doc, getDoc, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";


function SettingsPage() {
  return (
    <>
      <title>coming soon | skillmesa</title>
      <h1>(DEFUNCT) Settings</h1>
        <h2 className='textmedium'>Account Details</h2>
        <textarea placeholder="loading bio.." className="textsmall"></textarea><br></br><button className='texttiny'>save bio</button>
        <br></br><br></br>
        <input type="file"></input><br></br><br></br><button className='texttiny'>upload profile picture</button>
        <br></br><br></br>
        <input type="text" placeholder="loading username.." className="textsmall"></input>  <button className='texttiny'>save username</button>
        <br></br>
        <input type="text" placeholder="loading display name.." className="textsmall"></input>  <button className='texttiny'>save display name</button>
        <br></br>
        <input type="date" className='textsmall'></input>  <button className='texttiny'>save birthday</button>
        <h2 className='textmedium'>Contact Info</h2>
        <input type="text" placeholder="loading email.." className="textsmall"></input>  <button className='texttiny'>save email</button>
        <br></br>
        <input type="text" placeholder="loading phone number.." className="textsmall"></input>  <button className='texttiny'>save phone number</button>
        <h2 className='textmedium'>Security</h2>
        <input type="password" placeholder="current password.." className="textsmall"></input><br></br>
        <input type="password" placeholder="new password.." className="textsmall"></input><br></br>
        <input type="password" placeholder="confirm new password.." className="textsmall"></input><br/><br/><button className='texttiny'>change password</button>
        <br></br><br></br>
    </>
  );
}

export default SettingsPage;