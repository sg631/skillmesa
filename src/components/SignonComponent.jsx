import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { TabBarElement, TabContainerElement } from '../components/TabElements.jsx';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase.js";
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";



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

    async function handleSignUp() {
        try {
            const userCredential = await createUserWithEmailAndPassword(
            auth,
            signUpData.email,
            signUpData.password
            );
            const user = userCredential.user;

            // --- generate random colors ---
            const rand = () => Math.floor(Math.random() * 256);
            const rectColor = `rgb(${rand()}, ${rand()}, ${rand()})`;
            const circleColor = `rgb(${rand()}, ${rand()}, ${rand()})`;

            // --- build SVG string (rect + circle) ---
            const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
                <rect x="50" y="50" width="100" height="100" fill="${rectColor}" />
                <circle cx="250" cy="150" r="70" fill="${circleColor}" />
            </svg>
            `.trim();

            // --- convert to data URL (URI-encoded) ---
            const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
            
            // Add user info to Firestore 'users' collection
            await setDoc(doc(db, "users", user.uid), {
                fullname: signUpData.realName,
                username: signUpData.username,
                email: signUpData.email,
                createdAt: new Date(),
                profilePic: {
                    setProfilePic: false,
                    svgDataUrl: svgDataUrl,
                    currentUrl: svgDataUrl
                },
                dob: new Date(signUpData.dob) || null,
                displayName: signUpData.displayName || signUpData.username,
                contact: {
                    email: signUpData.email,
                    phone: null
                }
            });

            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: signUpData.displayName || signUpData.username,
                photoURL: svgDataUrl
            });

            // redirect or continue
            window.location.href = "/home";
        } catch (error) {
            alert(`Error ${error.code || ""}: ${error.message || error}`);
            console.error(error);
        }
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
                <li data-display-index="0" style={{ display: activeTab === 0 ? 'block' : 'none' }}><form onSubmit={(e) =>{e.preventDefault();handleSignUp()}}>
                    <h1>Sign Up</h1>
                    <input type="text" placeholder="Full Name *" onChange={(e) => setSignUpData({ ...signUpData, realName: e.target.value })}/>
                    <br></br><br></br>
                    <input type="text" placeholder="Display Name" onChange={(e) => setSignUpData({ ...signUpData, displayName: e.target.value })}/>
                    <br></br><br></br>
                    <input type="text" placeholder="Username *" onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })} />
                    <br></br><br></br>
                    <input type="date" placeholder="Birthday" onChange={(e) => setSignUpData({ ...signUpData, dob: e.target.value })} />
                    <br></br><br></br>
                    <input type="email" placeholder="Email *" onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} />
                    <br></br><br></br>
                    <input type="password" autoComplete="skillmesa" placeholder="Password *" onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}/>
                    <br></br><br></br>
                    <button type="submit">Sign Up</button>
                </form></li>
                <li data-display-index="1" style={{ display: activeTab === 1 ? 'block' : 'none' }}><form onSubmit={(e) =>{e.preventDefault();handleLogin()}}>
                    <h1>Log In</h1>
                    <input type="text" placeholder="Email *" onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
                    <br></br><br></br>
                    <input type="password" autoComplete="skillmesa" placeholder="Password *" onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
                    <br></br><br></br>
                    <button type="submit">Log In</button>
                </form></li>
            </TabContainerElement>

        </div>
    );
}

export default SignonComponent;