import React, { useState, useEffect } from "react";

// import {  } from "firebase/auth";
// import { auth } from "../firebase.js";
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

function ListingComponent({ listingId }) {
    const listings = collection(db, "listings");
    const [title, setTitle] = useState("Loading...");
    const [description, setDescription] = useState("Loading...");
    const [owner, setOwner] = useState("Loading...");
    useEffect(() => {
        const fetchListing = async () => {
            const listingDoc = doc(listings, id);
            const listingSnap = await getDoc(listingDoc);
            if (listingSnap.exists()) {
                const data = listingSnap.data();
                setTitle(data.title);
                setDescription(data.description);
                setOwner(data.owner);
            } else {
                setTitle("Listing not found");
                setDescription("");
                setOwner("");
            }
        };
        fetchListing();
    }, [id]);
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