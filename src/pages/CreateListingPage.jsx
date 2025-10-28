import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from "../firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DropinImgEditor from '../components/DropinImgEditor';
import showAlert from '../components/ShowAlert';

function CreateListingPage() {
    const [user, setUser] = React.useState(null);
    const [checkedAuth, setCheckedAuth] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState(null);
    const [selectedImage, setSelectedImage] = React.useState(null);
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [tags, setTags] = React.useState("");
    const [category, setCategory] = React.useState("coding");
    const [type, setType] = React.useState("class");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [online, setOnline] = React.useState(true);
    const [price, setPrice] = React.useState("");
    const [zipCode, setZipCode] = React.useState("")

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckedAuth(true);
    });
    return () => unsubscribe();
  }, []);

  function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!user) {
      showAlert("You must be signed in to create a listing.");
      return;
    }
    if (!title || !description) {
      showAlert("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // 1️⃣ Create the Firestore doc first
      const listingsRef = collection(db, "listings");
      const newListingRef = await addDoc(listingsRef, {
        title,
        description,
        owner: user.uid,
        rating: -1,
        tags: tagsArray,
        category,
        type,
        online,
        editors: [],
        thumbnailURL: "", // placeholder
        createdAt: new Date().toISOString(),
        price:parseFloat(price).toFixed(2),
        zipCode
      });

      let imageURL = "";

      // 2️⃣ Upload image (if any)
      if (selectedImage) {
        const fileExtension = selectedImage.name.split(".").pop();
        const imageRef = ref(
          storage,
          `listings/${newListingRef.id}/thumbnail.${fileExtension}`
        );

        await uploadBytes(imageRef, selectedImage);
        imageURL = await getDownloadURL(imageRef);
      }

      // 3️⃣ Update Firestore doc with the image URL
      if (imageURL) {
        await updateDoc(doc(db, "listings", newListingRef.id), {
          thumbnailURL: imageURL,
        });
      }

      showAlert("✅ Listing created successfully!");
      window.location.href = "/home";
    } catch (error) {
      console.error("Error creating listing:", error);
      showAlert("Failed to create listing. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <title>create listing | skillmesa</title>
      <br />
      <h1>Create new listing</h1>

      <input
        type="text"
        placeholder="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      /><br /><br />

      <textarea
        placeholder="Description *"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      ></textarea><br /><br />

      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      /><br /><br />

      <input
        type="number"
        className="priceinput"
        placeholder="Price (decimal in USD), 0 for free"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      /><br/><br/>

      <input
        type="text"
        placeholder="ZIP Code"
        value={zipCode}
        onChange={(e) => setZipCode(e.target.value)}
      /><br/><br/>

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="coding">Coding</option>
        <option value="design">Design</option>
        <option value="writing">Writing</option>
        <option value="music">Music</option>
        <option value="math">Math</option>
        <option value="business">Business</option>
        <option value="other">Other</option>
      </select><br /><br />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="class">Class</option>
        <option value="service">Skill service</option>
      </select><br /><br />

      <select value={online} onChange={(e) => setOnline(e.target.value)}>
        <option value="in-person">In-person (Recommended)</option>
        <option value="online">Online</option>
      </select><br /><br />

      <h2>Upload Thumbnail</h2>
        <p>
        You can use the Filerobot image editor if you wish to create <br /> a thumbnail right away. You have to still download the picture and <br />upload it as a thumbnail. It is currently highly expirimental and may not <br />function as intended.
        </p>
      <input type="file" accept="image/*" onChange={handleImageSelect} /><br /><br />
        <DropinImgEditor />
      <br /><br />
      {previewUrl && (
        <img
          className="listing-thumbnail"
          src={previewUrl}
          alt="Preview"
        />
      )}
      <br /><br />
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Listing"}
      </button>

      <footer className="texttiny">
        Skillmesa is currently in development. Stay tuned for updates!
      </footer>
    </>
  );
}

export default CreateListingPage;
