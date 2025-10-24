import React, { useState, useEffect } from "react";

// import {  } from "firebase/auth";
// import { auth } from "../firebase.js";
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { LinkImage, LinkButton } from "./LinkElements.jsx";
import { Link } from "react-router-dom";

function ListingComponent({ id }) {
    const listings = collection(db, "listings");
    const [title, setTitle] = useState("Loading...");
    const [description, setDescription] = useState("Loading...");
    const [owner, setOwner] = useState("Loading...");
    const [tags, setTags] = useState([]);
    useEffect(() => {
        const fetchListing = async () => {
            const listingDoc = doc(listings, id);
            const listingSnap = await getDoc(listingDoc);
            if (listingSnap.exists()) {
                const data = listingSnap.data();
                setTitle(data.title);
                setDescription(data.description);
                setOwner(data.owner);
                setTags(data.tags || []);
            } else {
                setTitle("Listing not found");
                setDescription("");
                setOwner("");
                setTags([]);
            }
        };
        fetchListing();
    }, [id]);
    return (
        <>
            <div className="listing">
                <img className="listing-thumbnail"></img>
                <span className="listing-title">{title}</span>
                <p className="listing-description">
                    {description}
                </p>
                <ul className="listing-tags-container">
                    {tags.map((tag, index) => (
                        <li className="listing-tag">{tag}</li>
                    ))}
                </ul>
                <div className="controls">
                    <div className="accdisplay">
                        <image className="accdisplay-profilepic"></image>
                        <span className="accdisplay-text">{owner}</span>
                    </div>
                    <hr></hr>
                    <LinkButton to={`/listing/${id}`} className="fullwidth">View Listing</LinkButton>
                    <hr></hr>
                    <LinkButton to={`/editlisting/${id}`} className="fullwidth">Edit Listing</LinkButton>
                </div>
            </div>
        </>
    );
}

export default ListingComponent;