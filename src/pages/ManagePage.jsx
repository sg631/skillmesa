import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { LinkButton } from "../components/LinkElements";
import showAlert from "../components/ShowAlert";
import { TabBarElement, TabContainerElement } from "../components/TabElements";
import TextEditor from "../components/TextEditor";
import DropinImgEditor from "../components/DropinImgEditor";

function ManagePage() {
  const { listingId } = useParams();
  const [listingData, setListingData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [thumbnailURL, setThumbnailUrl] = useState("");

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);

  const user = auth.currentUser;

  // Fetch listing and owner info
  useEffect(() => {
    if (!listingId) return;
    let isMounted = true;

    async function fetchListing() {
      setLoading(true);
      try {
        const listingRef = doc(db, "listings", listingId);
        const listingSnap = await getDoc(listingRef);

        if (!listingSnap.exists()) {
          if (isMounted) setListingData(null);
          return;
        }

        const listing = { id: listingSnap.id, ...listingSnap.data() };
        if (isMounted) {
          setListingData(listing);
          setTitle(listing.title || "");
          setDescription(listing.description || "");
          setTags(listing.tags || []);
          setThumbnailUrl(listing.thumbnailURL)
          console.log(thumbnailURL)
        }

        // Fetch owner info
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
    return () => { isMounted = false; };
  }, [listingId]);

  const handleSaveAll = async () => {
    try {
      await setDoc(
        doc(db, "listings", listingId),
        {
          title,
          description,
          thumbnailURL,
          tags
        },
        { merge: true }
      );
      showAlert("Listing saved successfully!");
    } catch (err) {
      console.error("Failed to save listing:", err);
      showAlert("Failed to save listing.");
    }
  };

  if (loading) return <p>Loading listing...</p>;
  if (!listingData) return <p>Listing not found.</p>;

  const ownerName = ownerData?.displayName || "Unknown User";
  const profilePicUrl = ownerData?.profilePic?.currentUrl || "/assets/account1.svg";

  return (
    <div className="listing-detail-page">
      <title>manage | skillmesa</title>
      <div className="largelisting">
        {/* Editable Title */}
        <br/><br/><br/>
        <textarea
          className="text-textarea textlarge"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Listing images */}
        {listingData.images?.length > 0 && (
          <div>
            {listingData.images.map((img, i) => (
              <img key={i} src={img.currentUrl || img.url} alt={`Listing ${i + 1}`} />
            ))}
          </div>
        )}

        {listingData.thumbnailURL && (
          <img
            className="listing-thumbnail"
            src={listingData.thumbnailURL}
            alt="Listing Thumbnail"
          />
        )}

        {/* Editable Description */}
        <textarea
          className="text-textarea textsmall"
          style={{ maxWidth: "none", width: "560px", fontWeight: "400" }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <p><strong>Price:</strong> {listingData.price ? `$${listingData.price}` : "Not specified"}</p>

        {/* Owner info */}
        <div
          className="accdisplay"
          onClick={() => (window.location = "/profile/" + listingData.owner)}
          style={{ cursor: "pointer" }}
        >
          <img className="accdisplay-profilepic" src={profilePicUrl} alt="Owner" />
          <span className="accdisplay-text">{ownerName}</span>
        </div>

        <ul className="listing-tags-container">
          {listingData.tags?.map((tag, i) => (
            <li key={i} className="listing-tag">{tag}</li>
          ))}
          <li className="listing-tag" style={{ cursor: "pointer" }} onClick={() => {tags.push(prompt("Add a tag:"))}}>+</li>
        </ul>

        <LinkButton to={"/listing/" + listingId}>View</LinkButton>
      </div>

      <div className="listing-detail-more-details">
        <br/><br/><br/>
        <TabBarElement>
          <li onClick={() => setActiveTab(0)}>Attached Info</li>
          <li onClick={() => setActiveTab(1)}>Images</li>
          <li onClick={() => setActiveTab(2)}>Filerobot Editor</li>
          <li onClick={() => setActiveTab(3)}>Files</li>
          <li onClick={() => setActiveTab(4)}>Manage</li>
        </TabBarElement>

        <TabContainerElement tabIndex={activeTab}>
          <li data-display-index="0">
            {/* Long Description Editor */}
            <h1>We apologize for the inconvenience</h1>
            <code>Temporarily removed extra info panel</code>
            <br />
          </li>

          <li data-display-index="1">
            <h1>We apologize for the inconvenience</h1>
            <p><code>Temporarily removed image addition.</code> For thumbnail modification, visit the "Manage" tab.</p>
          </li>

          <li data-display-index="2">
            <h1>Image editor</h1>
            <p>Warning, it is currently extremely expirimental and may not function as expected whatsoever. You have to use the save functionality for now, you cannot directly upload to images from the editor.</p>
            <DropinImgEditor />
          </li>

          <li data-display-index="3">
            <h1>Sharing files is coming soon</h1>
            <p>Use other methods of sharing files with collaborators or participants for now.</p>
          </li>

          <li data-display-index="4">
            <div className="controls" style={{ width: "100%", height: "700px" }}>
              <h1>Actions</h1>
              <button className="fullwidth" onClick={handleSaveAll}>Save</button>
              <hr />
              <button className="fullwidth" disabled onClick={() => showAlert("Sorry, but skillmesa does not currently support additional collaborators.")}>Add Collaborators</button>
              <hr />
              <button className="fullwidth">Change Thumbnail</button>
              <hr />
              <button className="fullwidth">Change Type</button>
              <hr />
              <h2>Dangerous Actions</h2>
              <button disabled className="textred fullwidth">Change Owner</button>
              <hr />
              <button disabled className="textred fullwidth">Archive</button>
              <hr />
              <button className="textred fullwidth">Change Visibility</button>
              <hr />
              <button className="textred fullwidth">Delete</button>
              <hr />
            </div>
          </li>
        </TabContainerElement>
      </div>
    </div>
  );
}

export default ManagePage;
