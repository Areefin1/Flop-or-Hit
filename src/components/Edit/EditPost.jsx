import React, { useEffect, useState } from "react";
import { supabase } from "../../client";
import "./EditPost.css";

function EditPost() 
{
    const [posts, setPosts] = useState([]);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUserPosts = async () => {
            const { data: userData } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("flop-or-hit")
                .select("*")
                .eq("user_id", userData.user.id)
                .order("created_at", { ascending: false });

            if(error)
            {
                setError(error.message);
            }
            else
            {
                setPosts(data);
            }
        };

        fetchUserPosts();
    }, []);


    const handleEditClick = (post) => {
        setEditingPostId(post.id);
        setEditTitle(post.title);
        setEditContent(post.content || "");
        setEditImageUrl(post.image_url || "");
    };

    const handleSaveChanges = async () => {
        const { error } = await supabase
            .from("flop-or-hit")
            .update({
                title: editTitle,
                content: editContent || null,
                image_url: editImageUrl || null,
            })
            .eq("id", editingPostId);

        if(error)
        {
            setError(error.message);
        }
        else
        {
            const updatedPosts = posts.map((post) =>
            post.id === editingPostId ? { ...post, title: editTitle, content: editContent, image_url: editImageUrl } : post);

            setPosts(updatedPosts);
            setEditingPostId(null);
        }
    };

    const handleDelete = async (postId) => {
        const { error } = await supabase
            .from("flop-or-hit")
            .delete()
            .eq("id", postId);

        if(error)
        {
            setError(error.message);
        }
        else
        {
            const updatedPosts = posts.filter((post) => post.id !== postId);
            setPosts(updatedPosts);
        }
    }

    return (
        <>
            <div className="edit-post-container">
                {error && <p style={{ color: "red"}}>{error}</p>}
                <div className="post-grid">
                    {posts.map((post) => (
                        <div key={post.id} className="edit-post-card">
                            {editingPostId === post.id ? (
                                <>
                                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                    <textarea rows="3" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                                    <input type="text" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} />
                                    <button onClick={handleSaveChanges}>Save changes</button>
                                </>
                            ) : (
                                <>
                                    <h3>{post.title}</h3>
                                    {post.content && <p>{post.content}</p>}
                                    {post.image_url && (
                                    <img src={post.image_url} alt="Post" className="post-image" />
                                    )}
                                    <button onClick={() => handleEditClick(post)}>Edit</button>
                                    <button onClick={() => handleDelete(post.id)} className="delete-button">Delete</button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )

}

export default EditPost;