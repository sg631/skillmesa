import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { LinkButton, LinkImage } from "../components/LinkElements"
import AlertComponent from '../components/ShowAlert'
import showAlert from "../components/ShowAlert";

function ManagePage() {
  const { listingId } = useParams(); // route param
  const [listingData, setListingData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }


  useEffect(() => {
    if (!listingId) return;

    let isMounted = true;

    async function fetchListing() {
      setLoading(true);
      try {
        // Fetch listing
        const listingRef = doc(db, "listings", listingId);
        const listingSnap = await getDoc(listingRef);

        if (!listingSnap.exists()) {
          if (isMounted) setListingData(null);
          return;
        }

        const listing = { id: listingSnap.id, ...listingSnap.data() };
        if (isMounted) setListingData(listing);

        // Fetch owner info (users/{ownerUID})
        if (listing.owner) {
          const ownerRef = doc(db, "users", listing.owner);
          const ownerSnap = await getDoc(ownerRef);
          if (ownerSnap.exists()) {
            if (isMounted) setOwnerData(ownerSnap.data());
          } else {
            if (isMounted) setOwnerData(null);
          }
        }
      } catch (err) {
        console.error("Error fetching listing:", err);
        if (isMounted) {
          setListingData(null);
          setOwnerData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchListing();
    return () => {
      isMounted = false;
    };
  }, [listingId]);

  if (loading) return <p>Loading listing...</p>;
  if (!listingData) return <p>Listing not found.</p>;

  const ownerName = ownerData?.displayName || "Unknown User";
  const profilePicUrl = ownerData?.profilePic?.currentUrl || "/assets/account1.svg";

  return (
    <div className="listing-detail-page">
      <title>manage listing | skillmesa</title>
      <div className="largelisting">
        <br /><br />
        <textarea className="text-textarea textlarge" defaultValue={listingData.title || "Untitled Listing"}></textarea>

        {/* Listing images */}
        {listingData.images && listingData.images.length > 0 && (
          <div>
            {listingData.images.map((img, index) => (
              <img
                key={index}
                src={img.currentUrl || img.url}
                alt={`Listing Image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Thumbnail */}
        {listingData.thumbnailURL && (
          <img
            className="listing-thumbnail"
            src={listingData.thumbnailURL}
            alt="Listing Thumbnail"
          />
        )}

        <textarea className="text-textarea textsmall" style={{maxWidth: 'none', width: '560px', fontWeight:'400'}} defaultValue={listingData.description || "No description."} />
        <p><strong>Price:</strong> {listingData.price ? `$${listingData.price}` : "Not specified"}</p>

        {/* Owner info */}
        <div
          className="accdisplay"
          onClick={() => (window.location = "/profile/" + listingData.owner)}
          style={{ cursor: "pointer" }}
        >
          <img
            className="accdisplay-profilepic"
            src={profilePicUrl}
            alt="Owner profile"
          />
          <span className="accdisplay-text">{ownerName}</span>
        </div>

        <ul className="listing-tags-container">
        {listingData.tags.map((tag, index) => (
          <li key={index} className="listing-tag">{tag}</li>
        ))}
        <li className="listing-tag" style={{cursor: "pointer"}} onClick={()=>{showAlert("hi")}}>+</li>
      </ul>

        <button disabled>Locked Resource Page (COMING SOON)</button><hr/>
        <button onClick={() => {copyTextToClipboard("https://skill-mesa.web.app/share/" + listingData.id);window.alert("Copied share link!")}}>Share</button>
      </div>
      <div className="listing-detail-more-details">
        <br/><br/><br/><button>Save</button>
      </div>
    </div>
  );
}

export default ManagePage;
