import { useState } from "react";
import { supabase } from "../../client";
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

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if(userError || !userData.user)
        {
            setError("You must be logged in to create a post.");
            return;
        }

        const { error: insertError } = await supabase
            .from("posts")
            .insert([
                {
                    title: title.trim(),
                    content: content.trim() || null,
                    user_id: userData.user.id,
                },
            ]);
        
        if(insertError)
        {
            setError(insertError.message);
        }
        else
        {
            setSuccess("Post created successfully!");
            setTitle("");
            setContent("");
            setImageUrl("");
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