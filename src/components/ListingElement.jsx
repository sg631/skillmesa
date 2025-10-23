import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { TabBarElement, TabContainerElement } from './TabElements.jsx';

// import {  } from "firebase/auth";
// import { auth } from "../firebase.js";



function ListingComponent({ width, height, owner, canEdit, type, title, description, tags = [] }) {
    return (
        <>
            <div class="listing">
                <Image class="listing-thumbnail"></Image>
                <span class="listing-title">{title}</span>
                <p class="listing-description">
                    {description}
                </p>
                <div class="controls">
                    <div class="accdisplay">
                        <Image class="accdisplay-profilepic"></Image>
                        <span class="accdisplay-text">{owner}</span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SignonComponent;