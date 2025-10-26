import React from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { LinkButton } from "../components/LinkElements.jsx";

const listingsCollection = collection(db, "listings");
const listingsByOwnerQuery = (ownerUID) => query(listingsCollection, where("owner", "==", ownerUID));

// Fetch profile data from Firestore
async function fetchProfileData(userUID) {
  try {
    const userDocRef = doc(db, "users", userUID);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.warn("No user found with UID:", userUID);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

function ProfilePage() {
  const { userUIDparam } = useParams(); // route param
  const [profileData, setProfileData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true; // prevent updates on unmounted component

    async function loadProfile() {
      setLoading(true);
      const data = await fetchProfileData(userUIDparam);

      if (isMounted) {
        setProfileData(data);
        setLoading(false);
      }
    }

    if (userUIDparam) loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userUIDparam]);

  if (loading) {
    return (
      <>
        <title>Skillmesa | Loading...</title>
        <p>Loading profile...</p>
      </>
    );
  }

  if (!profileData) {
    return (
      <>
        <title>Skillmesa | Not Found</title>
        <h1>User not found</h1>
        <p>The profile you’re looking for doesn’t exist.</p>
      </>
    );
  }

  const displayName = profileData.displayName || "Unnamed User";
  const ownerQuery = listingsByOwnerQuery(userUIDparam);

  return (
    <>
      <title>contacts | skillmesa</title>
      <div className="profile-container">
        <h1>{displayName}</h1>
        <code className="acc">
          {profileData.profilePic?.currentUrl && (
            <img className="profilepic-inline" src={profileData.profilePic.currentUrl} alt="Profile" />
          )}
          {profileData.username || "N/A"}
        </code>
        <br />
        <span className="emaildisplay">{profileData.contact.email}</span>
        <LinkButton to={"mailto:" + profileData.contact.email}>Send Email</LinkButton>
        <span className="phonenumdisplay">{profileData.contact.phone || "No attached phone number"}</span>
        <button disabled>Chat (COMING SOON)</button>
      </div>

      <footer className="texttiny">
        Skillmesa is currently in development. Stay tuned for updates!
      </footer>
    </>
  );
}

export default ProfilePage;
