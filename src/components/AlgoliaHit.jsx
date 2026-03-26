import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Highlight } from "react-instantsearch";
import { LinkButton } from "./LinkElements.jsx";

function AlgoliaHit({ hit }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, []);

  const isOwner = Boolean(currentUser && hit.owner && currentUser.uid === hit.owner);
  const tags = hit.tags || [];
  const online = hit.online;

  return (
    <div className="listing">
      <span className="listing-type-label" data-value={hit.type}>{hit.type}</span>
      <span
        className="listing-online-label"
        data-value={online ? "online" : "in-person"}
      >
        {online ? "online" : "in-person"}
      </span>
      <span className="listing-zip-label" data-value={hit.zipCode}><code>{hit.zipCode}</code></span>
      <hr />
      <img className="listing-thumbnail" alt="Listing thumbnail" src={hit.thumbnailURL} />
      <span className="listing-title">
        <Highlight attribute="title" hit={hit} />
      </span>
      <p className="listing-description">
        <Highlight attribute="description" hit={hit} />
      </p>

      <ul className="listing-tags-container">
        {tags.map((tag, index) => (
          <li key={index} className="listing-tag">{tag}</li>
        ))}
      </ul>

      <div className="controls-acc">
        <div className="accdisplay" onClick={() => window.location = "/profile/" + hit.owner}>
          <img
            className="accdisplay-profilepic"
            src={hit.ownerProfilePicUrl || "/assets/account1.svg"}
            alt="Owner profile"
          />
          <span className="accdisplay-text">{hit.ownerDisplayName || "Unknown"}</span>
        </div>

        <hr />
        <LinkButton to={`/listing/${hit.objectID}`} className="fullwidth">
          View Listing
        </LinkButton>
        <hr />
        <LinkButton disabled={!isOwner} to={`/manage/${hit.objectID}`} className="fullwidth">
          Manage Listing
        </LinkButton>
      </div>
    </div>
  );
}

export default AlgoliaHit;
