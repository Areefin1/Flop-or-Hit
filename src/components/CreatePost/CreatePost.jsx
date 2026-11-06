import { useState, useRef, useEffect } from "react";
import { createPost, uploadPostImage } from "../../services/service"
import "./CreatePost.css";



function CreatePost ()
{
    const fileInputRef = useRef(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!imageFile) {
            setImagePreview(null);
            return;
        }

        const previewUrl = URL.createObjectURL(imageFile);
        setImagePreview(previewUrl);

        return () => {
            URL.revokeObjectURL(previewUrl);
        };
    }, [imageFile]);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if(!title.trim())
        {
            setError("Title is required.");
            return;
        }

        try
        {
            let imagePath = null;

            if(imageFile)
            {
                imagePath = await uploadPostImage(imageFile);
            }

            await createPost(
                title.trim(),
                content.trim() || null,
                imagePath
            );

            // We reach here ONLY if createPost succeeded.
            setSuccess("Post created successfully!");
            setTitle("");
            setContent("");
            setImageFile(null);
            fileInputRef.current.value = "";
        }
        catch(error)
        {
            // We reach here if createPost throws an error.
            setError(error.message);
        }
    };

    return (
        <>
            <div className="create-post-container">
                <form className="create-post-form" onSubmit={handleCreatePost}>
                    <h2>Create a New Post</h2>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {success && <p style={{ color: "green" }}>{success}</p>}

                    <label htmlFor="title">Title</label>
                    <input 
                        type="text" 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required
                        maxLength={100} 
                    />
                    <label htmlFor="content">Content (optional)</label>
                    <textarea id="content" rows="4" value={content} onChange={(e) => setContent(e.target.value)} />

                    <label htmlFor="imageFile">Image (optional)</label>
                    <input
                        ref={fileInputRef} 
                        type="file"
                        id="imageFile"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    />

                    {imagePreview && (
                        <div className="create-post-image-preview">
                            <img
                                src={imagePreview}
                                alt="Selected post preview"
                            />

                            <button
                                type="button"
                                className="remove-preview-button"
                                onClick={() => {
                                    setImageFile(null);
                                    fileInputRef.current.value = "";
                                }}
                            >
                                Remove Image
                            </button>
                        </div>
                    )}

                    <button type="submit">Create Post</button>
                </form>
            </div>
        </>
    )
} 

export default CreatePost;