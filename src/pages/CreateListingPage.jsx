import React from 'react';
import { LinkButton, LinkImage } from '../components/LinkElements.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from "../firebase";

function CreateListingPage() {
    const [user, setUser] = React.useState(null);
    const [checkedAuth, setCheckedAuth] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState(null);
    const [selectedImage, setSelectedImage] = React.useState(null);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setCheckedAuth(true); // marks that Firebase has finished checking
        });
        return () => unsubscribe();
    }, []);

    function handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file)); // For preview
    }

    

    return (
        <>
            <title>create listing | skillmesa</title>
            <br />
            <h1>Create new listing</h1>
            <input type="text" placeholder="Title" /><br /><br />
            <textarea placeholder="Description"></textarea><br /><br />
            <input type="text" placeholder="Tags (comma separated)" /><br /><br />
            <select defaultValue="Select Category">
                <option value="coding">Coding</option>
                <option value="design">Design</option>
                <option value="writing">Writing</option>
                <option value="music">Music</option>
                <option value="marketing">Marketing</option>
                <option value="business">Business</option>
                <option value="other">Other</option>
            </select><br /><br />
            <select defaultValue="Select Type *">
                <option value="coding">Class</option>
                <option value="design">Skill service</option>
            </select><br /><br />
            <h2>Upload Thumbnail:</h2><br />
            <input type="file" accept="image/*" onChange={handleImageSelect}/><br /><br />
            <img className='listing-thumbnail' src={previewUrl}/><br /><br />
            <LinkButton to="/home" className="textcenter">Submit Listing</LinkButton>
            <footer className='texttiny'>
            Skillmesa is currently in development. Stay tuned for updates!
            </footer>
        </>
    );
}

export default CreateListingPage;
