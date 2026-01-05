import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from "../firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  const [online, setOnline] = React.useState("in-person"); // store as string in form, convert when saving
  const [price, setPrice] = React.useState("");
  const [zipCode, setZipCode] = React.useState("");

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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      showAlert("You must be signed in to create a listing.");
      return;
    }
    if (!title || !description || !tags || !price || !zipCode || !selectedImage) {
      showAlert("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const listingsRef = collection(db, "listings");
      const newListingRef = await addDoc(listingsRef, {
        title,
        description,
        owner: user.uid,
        rating: -1,
        tags: tagsArray,
        category,
        type,
        online: online === "online",
        editors: [],
        thumbnailURL: "",
        createdAt: new Date().toISOString(),
        price: Number(parseFloat(String(price).replace(/[^0-9.]/g, '')).toFixed(2)),
        zipCode
      });

      let imageURL = "";

      if (selectedImage) {
        const fileExtension = selectedImage.name.split(".").pop();
        const imageRef = ref(
          storage,
          `listings/${newListingRef.id}/thumbnail.${fileExtension}`
        );

        await uploadBytes(imageRef, selectedImage);
        imageURL = await getDownloadURL(imageRef);
      }

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

      <form onSubmit={handleSubmit} noValidate>
        <input
          required
          type="text"
          placeholder="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        /><br /><br />

        <textarea
          required
          placeholder="Description *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea><br /><br />

        <input
          required
          type="text"
          placeholder="Tags (comma separated) *"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        /><br /><br />

        <input
          required
          type="number"
          className="priceinput"
          placeholder="USD, NUMBER ONLY*"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        /><br/><br/>

        <input
          required
          type="text"
          placeholder="ZIP Code *"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
        /><br/><br/>

        <label>
          Category *
          <select required value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="coding">Coding and Development</option>
            <option value="music">Music</option>
            <option value="math">Math</option>
            <option value="art">Art</option>
            <option value="language">Language</option>
            <option value="design">Design</option>
            <option value="writing">Writing and Editing</option>
            <option value="business">Business and Marketing</option>
            <option value="home-services">Home and Personal Services</option>
            <option value="health">Health, Fitness and Wellness</option>
            <option value="tutoring">General Tutoring</option>
            <option value="education">Class (Not encompassed by other options)</option>
            <option value="volunteering">Volunteering Opportunity</option>
            <option value="other">Other</option>
          </select>
        </label>
        <br /><br />

        <label>
          Type *
          <select required value={type} onChange={(e) => setType(e.target.value)}>
            <option value="class">Class</option>
            <option value="service">Skill service</option>
          </select>
        </label>
        <br /><br />

        <label>
          Physical location *
          <select required value={online} onChange={(e) => setOnline(e.target.value)}>
            <option value="in-person">In-person (Recommended)</option>
            <option value="online">Online</option>
          </select>
        </label>
        <br /><br />

        <h2>Upload Thumbnail *</h2>
        <p>
          <strong>Reccomended aspect ratio is 7:4, but thumbnail resolution is 350x200.</strong><br/>We reccomend Excalidraw or Canva for creating a thumbnail. <br/>Embedded below is an expirimental interface with Excalidraw. We reccomend using it on its official page, but if not you can use it below.
        </p>
        <input required type="file" accept="image/*" onChange={handleImageSelect} /><br /><br />
        <br /><br />
        {previewUrl && (
          <img
            className="listing-thumbnail"
            src={previewUrl}
            alt="Preview"
          />
        )}
        <br /><br />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Listing"}
        </button>
      </form>
    </>
  );
}

export default CreateListingPage;
