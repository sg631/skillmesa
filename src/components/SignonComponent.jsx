import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { TabBarElement, TabContainerElement } from '../components/TabElements.jsx';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
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
                const user = userCredential.user;
                //Set display name to username
                updateProfile({
                    displayName: signUpData.username,
                    // Generate avatar image using canvas and a function
                    photoURL: () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 400;
                        canvas.height = 300;
                        document.body.appendChild(canvas);

                        // Get the 2D rendering context
                        const ctx = canvas.getContext('2d');

                        // Draw something on the canvas (e.g., a red rectangle)
                        ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
                        ctx.fillRect(50, 50, 100, 100);

                        // Draw a blue circle
                        ctx.beginPath();
                        ctx.arc(250, 150, 70, 0, Math.PI * 2);
                        ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
                        ctx.fill();

                        // Convert the canvas content to a data URL (e.g., PNG)
                        const imageDataURL = canvas.toDataURL('image/png');
                        document.body.removeChild(canvas);
                        return imageDataURL;
                    }
                });
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