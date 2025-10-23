import React, { useState, useEffect } from "react";

// import {  } from "firebase/auth";
// import { auth } from "../firebase.js";

function ListingComponent({ width, height, owner, canEdit, type, title, description, tags = [] }) {
    return (
        <>
            <div class="listing">
                <image class="listing-thumbnail"></image>
                <span class="listing-title">{title}</span>
                <p class="listing-description">
                    {description}
                </p>
                <div class="controls">
                    <div class="accdisplay">
                        <image class="accdisplay-profilepic"></image>
                        <span class="accdisplay-text">{owner}</span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ListingComponent;