import React from 'react';
import { Title, Text, TextInput, Textarea, Select, NumberInput, Button, Stack, Image, FileInput, Paper, TagsInput } from '@mantine/core';
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
  const [tags, setTags] = React.useState([]);
  const [category, setCategory] = React.useState("coding");
  const [type, setType] = React.useState("class");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [online, setOnline] = React.useState("in-person");
  const [price, setPrice] = React.useState("");
  const [zipCode, setZipCode] = React.useState("");

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckedAuth(true);
    });
    return () => unsubscribe();
  }, []);

  function handleImageSelect(file) {
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
    if (!title || !description || tags.length === 0 || !price || !zipCode || !selectedImage) {
      showAlert("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray = tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);

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
        zipCode,
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

      showAlert("Listing created successfully!");
      window.location.href = "/home";
    } catch (error) {
      console.error("Error creating listing:", error);
      showAlert("Failed to create listing. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack align="center" gap="md" py="xl" maw={600} mx="auto">
      <title>create listing | skillmesa</title>
      <Title order={1}>Create new listing</Title>

      <Paper shadow="sm" p="xl" radius="lg" w="100%" withBorder>
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <TextInput
              required
              label="Title"
              placeholder="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              required
              label="Description"
              placeholder="Description *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minRows={3}
              autosize
            />

            <TagsInput
              required
              label="Tags"
              placeholder="Type a tag and press Enter"
              value={tags}
              onChange={setTags}
              clearable
              acceptValueOnBlur
              splitChars={[',']}
            />

            <TextInput
              required
              label="Price (USD)"
              placeholder="e.g. 25.00"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <TextInput
              required
              label="ZIP Code"
              placeholder="ZIP Code *"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
            />

            <Select
              required
              label="Category"
              value={category}
              onChange={setCategory}
              data={[
                { value: "coding", label: "Coding and Development" },
                { value: "music", label: "Music" },
                { value: "math", label: "Math" },
                { value: "art", label: "Art" },
                { value: "language", label: "Language" },
                { value: "design", label: "Design" },
                { value: "writing", label: "Writing and Editing" },
                { value: "business", label: "Business and Marketing" },
                { value: "home-services", label: "Home and Personal Services" },
                { value: "health", label: "Health, Fitness and Wellness" },
                { value: "tutoring", label: "General Tutoring" },
                { value: "education", label: "Class (Not encompassed by other options)" },
                { value: "volunteering", label: "Volunteering Opportunity" },
                { value: "other", label: "Other" },
              ]}
            />

            <Select
              required
              label="Type"
              value={type}
              onChange={setType}
              data={[
                { value: "class", label: "Class" },
                { value: "service", label: "Skill service" },
              ]}
            />

            <Select
              required
              label="Physical location"
              value={online}
              onChange={setOnline}
              data={[
                { value: "in-person", label: "In-person (Recommended)" },
                { value: "online", label: "Online" },
              ]}
            />

            <FileInput
              required
              label="Upload Thumbnail"
              description="Recommended aspect ratio is 7:4 (350x200px)"
              placeholder="Choose image..."
              accept="image/*"
              onChange={handleImageSelect}
            />

            {previewUrl && (
              <Image
                src={previewUrl}
                alt="Preview"
                radius="md"
                maw={350}
                mx="auto"
              />
            )}

            <Button
              type="submit"
              fullWidth
              color="cyan"
              loading={isSubmitting}
              size="md"
            >
              {isSubmitting ? "Submitting..." : "Submit Listing"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}

export default CreateListingPage;
