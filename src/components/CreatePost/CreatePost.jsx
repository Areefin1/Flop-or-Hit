import { useState } from "react";
import { createPost } from "../../services/service"
import "./CreatePost.css";


function CreatePost ()
{
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
            await createPost(
                title.trim(),
                content.trim() || null
            );

            // We reach here ONLY if createPost succeeded.
            setSuccess("Post created successfully!");
            setTitle("");
            setContent("");
            setImageUrl("");
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

                    <label htmlFor="imageUrl">Image URL (optional)</label>
                    <input type="text" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

                    <button type="submit">Create Post</button>
                </form>
            </div>
        </>
    )
} 

export default CreatePost;