import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { TabBarElement, TabContainerElement } from '../components/TabElements.jsx';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";



function SignonComponent({ mode = "dual", width, height }) {
    const [activeTab, setActiveTab] = React.useState(0);
    //Set up storing input values
    const [signUpData, setSignUpData] = React.useState({
        realName: "",
        username: "",
        email: "",
        password: ""
    });
    const [loginData, setLoginData] = React.useState({
        email: "",
        password: ""
    });

    function handleSignUp() {

    createUserWithEmailAndPassword(auth, signUpData.email, signUpData.password)
  .then((userCredential) => {
    // For now we only handle basic signup
    const user = userCredential.user;
    //Redirect to home page or dashboard
    window.location.href = "/home";
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert("Error " + errorCode + ": " + errorMessage);
  });
}

function handleLogin() {
    signInWithEmailAndPassword(auth, loginData.email, loginData.password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    window.location.href = "/home";
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert("Error " + errorCode + ": " + errorMessage);
  });
}

    return (
        <div className="signup-login-box">
            <style>{`
                .signup-login-box {
                    background-color: #ffffff;
                    color: #333333;
                    font-family: inherit;
                    display: flex;
                    flex-direction: column;
                    width: ${width || "300px"};
                    height: ${height || "200px"};
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                }
            `}</style>
            {/* Signup/Login Switch Buttons */}
            <TabBarElement>
                <li onClick={() => setActiveTab(0)}>Sign Up</li>
                <li onClick={() => setActiveTab(1)}>Log In</li>
            </TabBarElement>
            <TabContainerElement tabIndex={activeTab} className="signon-tab-container">
                <li data-display-index="0" style={{ display: activeTab === 0 ? 'block' : 'none' }}>
                    <br></br>
                    <input type="text" placeholder="Real Name" onChange={(e) => setSignUpData({ ...signUpData, realName: e.target.value })}/>
                    <br></br><br></br>
                    <input type="text" placeholder="Username *" onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })} />
                    <br></br><br></br>
                    <input type="email" placeholder="Email *" onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} />
                    <br></br><br></br>
                    <input type="password" placeholder="Password *" onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}/>
                    <br></br><br></br>
                    <button onClick={() => handleSignUp()}>Sign Up</button>
                </li>
                <li data-display-index="1" style={{ display: activeTab === 1 ? 'block' : 'none' }}>
                    <h1>Log In</h1>
                    <input type="text" placeholder="Email *" onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
                    <br></br><br></br>
                    <input type="password" placeholder="Password *" onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
                    <br></br><br></br>
                    <button onClick={() => handleLogin()}>Log In</button>
                </li>
            </TabContainerElement>

        </div>
    );
}

export default SignonComponent;