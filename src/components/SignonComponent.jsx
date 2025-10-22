import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { TabBarElement, TabContainerElement } from '../components/TabElements.jsx';

function SignonComponent({ mode = "dual", width, height }) {
    const [activeTab, setActiveTab] = React.useState(0);

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
                    <input type="text" placeholder="Real Name" />
                    <br></br><br></br>
                    <input type="text" placeholder="Username *" />
                    <br></br><br></br>
                    <input type="email" placeholder="Email *" />
                    <br></br><br></br>
                    <input type="password" placeholder="Password *" />
                    <br></br><br></br>
                    <button onClick={() => console.log("Signing Up")}>Sign Up</button>
                </li>
                <li data-display-index="1" style={{ display: activeTab === 1 ? 'block' : 'none' }}>
                    <h1>Log In</h1>
                    <input type="text" placeholder="Username *" />
                    <br></br><br></br>
                    <input type="password" placeholder="Password *" />
                    <br></br><br></br>
                    <button onClick={() => console.log("Logging in")}>Log In</button>
                </li>
            </TabContainerElement>

        </div>
    );
}

export default SignonComponent;