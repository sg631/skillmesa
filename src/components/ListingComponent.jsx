import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { LinkButton } from "./LinkElements.jsx";

function ListingComponent({ id }) {
  const listings = collection(db, "listings");

  const [title, setTitle] = useState("Loading...");
  const [description, setDescription] = useState("Loading...");
  const [ownerUID, setOwnerUID] = useState(null);
  const [ownerName, setOwnerName] = useState("Loading...");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [tags, setTags] = useState([]);

  useEffect(() => {
    async function fetchListing() {
      try {
        const listingDoc = doc(listings, id);
        const listingSnap = await getDoc(listingDoc);

        if (listingSnap.exists()) {
          const data = listingSnap.data();
          setTitle(data.title);
          setDescription(data.description);
          setTags(data.tags || []);
          setOwnerUID(data.owner || null);
        } else {
          setTitle("Listing not found");
          setDescription("");
          setTags([]);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      }
    }

    fetchListing();
  }, [id]);

  useEffect(() => {
    async function fetchOwnerData() {
      if (!ownerUID) return;
      try {
        const userDocRef = doc(db, "users", ownerUID);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setOwnerName(userData.displayName || "Unnamed User");
          setProfilePicUrl(userData.profilePic?.currentUrl || "");
        } else {
          setOwnerName("Unknown User");
          setProfilePicUrl("");
        }
      } catch (error) {
        console.error("Error fetching owner data:", error);
      }
    }

    fetchOwnerData();
  }, [ownerUID]);

  return (
    <div className="listing">
      <img className="listing-thumbnail" alt="Listing thumbnail" />
      <span className="listing-title">{title}</span>
      <p className="listing-description">{description}</p>

      <ul className="listing-tags-container">
        {tags.map((tag, index) => (
          <li key={index} className="listing-tag">{tag}</li>
        ))}
      </ul>

      <div className="controls">
        <div className="accdisplay" onClick={() => window.location = "/profile/" + ownerUID}>
          <img
            className="accdisplay-profilepic"
            src={profilePicUrl || "/assets/account1.svg"}
            alt="Owner profile"
          />
          <span className="accdisplay-text">{ownerName}</span>
        </div>

        <hr />
        <LinkButton to={`/listing/${id}`} className="fullwidth">
          View Listing
        </LinkButton>
        <hr />
        <LinkButton to={`/editlisting/${id}`} className="fullwidth">
          Edit Listing
        </LinkButton>
      </div>
    </div>
  );
}

export default ListingComponent;
