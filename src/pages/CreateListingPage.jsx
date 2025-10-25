import React from 'react';
import { LinkButton } from '../components/LinkElements.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function CreateListingPage() {
  const [user, setUser] = React.useState(null);
  const [checkedAuth, setCheckedAuth] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [selectedImage, setSelectedImage] = React.useState(null);

  // form fields
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [category, setCategory] = React.useState("coding");
  const [type, setType] = React.useState("class");

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
      alert("You must be signed in to create a listing.");
      return;
    }

    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const listingsRef = collection(db, "listings");

      await addDoc(listingsRef, {
        title,
        description,
        owner: user.uid,
        rating: -1,
        tags: tagsArray,
        category,
        type,
        editors: [],
        createdAt: new Date().toISOString()
      });

      alert("Listing created successfully!");
      // optional: redirect to home
      window.location.href = "/home";
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Failed to create listing. Check console for details.");
    }
  }

  return (
    <>
      <title>create listing | skillmesa</title>
      <br />
      <h1>Create new listing</h1>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      /><br /><br />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      ></textarea><br /><br />

      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      /><br /><br />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="coding">Coding</option>
        <option value="design">Design</option>
        <option value="writing">Writing</option>
        <option value="music">Music</option>
        <option value="marketing">Marketing</option>
        <option value="business">Business</option>
        <option value="other">Other</option>
      </select><br /><br />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="class">Class</option>
        <option value="service">Skill service</option>
      </select><br /><br />

      <h2>Upload Thumbnail:</h2><br />
      <input type="file" accept="image/*" onChange={handleImageSelect} /><br /><br />
      {previewUrl && <img className="listing-thumbnail" src={previewUrl} alt="Preview" />}<br /><br />

      <button onClick={handleSubmit}>Submit Listing</button>

      <footer className="texttiny">
        Skillmesa is currently in development. Stay tuned for updates!
      </footer>
    </>
  );
}

export default CreateListingPage;
