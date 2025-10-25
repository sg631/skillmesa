import React from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { LinkButton } from "../components/LinkElements.jsx";
import CarouselElement from "../components/CarouselElement.jsx";
import ListingComponent from "../components/ListingComponent.jsx";

// const usersCollection = collection(db, "users");
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
  const { userUIDparam } = useParams(); // your dynamic route param
  const [profileData, setProfileData] = React.useState(null);
  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true; // prevent updates on unmounted component

    async function loadProfile() {
        setLoading(true);
        const data = await fetchProfileData(userUIDparam);
        let userListings = [];

        if (data) {
            const q = listingsByOwnerQuery(userUIDparam);
            const querySnapshot = await getDocs(q);
            userListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (isMounted) {
            setProfileData(data);
            setListings(userListings);
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

  return (
    <>
      <title>Skillmesa | User Profile</title>
      <div className="profile-container">
        <h1>{displayName}</h1>

        {/* Example of optional content */}
        <span className="textsmall">You may know them as <br /></span><code className="acc"><img className="profilepic-inline" src={profileData.profilePic.currentUrl} />{profileData.username || "N/A"}</code>
        <p>Bio: {profileData.bio || "No bio yet."}</p>

        <h2>Listings</h2>
        {
            listings.length > 0 ? 
                (
                    listings.map((listing) => (
                        <ListingComponent key={listing.id} id={listing.id} {...listing} />
                    ))
                ) : 
                (
                    <p>No listings yet.</p>
                )
        }


      </div>

      <footer className="texttiny">
        Skillmesa is currently in development. Stay tuned for updates!
      </footer>
    </>
  );
}

export default ProfilePage;
