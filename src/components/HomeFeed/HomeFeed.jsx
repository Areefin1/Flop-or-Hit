import React, { useEffect, useState } from "react";
import { supabase } from "../../client"; // Adjust the path to your client
import "./HomeFeed.css";

function HomeFeed() 
{ 
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState("");
    const [commentInputs, setCommentInputs] = useState({});

    
    useEffect(() => {
        const fetchPosts = async () => {
            const { data, error } = await supabase
            .from("flop-or-hit")
            .select("*")
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

        fetchPosts();
    }, []);

    const handleCommentChange = (postId, value) => {
        setCommentInputs((prev) => ({ ...prev, [postId]: value }));
    };

    const handleCommentSubmit = async (postId) => {
        const commentText = commentInputs[postId];
        if(!commentText || !commentText.trim()) return;

        const { data: userData } = await supabase.auth.getUser();

        const { error } = await supabase
            .from("comments")
            .insert([
                {
                    content: commentText,
                    post_id: postId,
                    user_id: userData.user.id,
                },
            ]);
        
            if(error)
            {
                setError(error.message);
            }
            else
            {
                setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
            }
    }

    const handleLike = async (postId, currentLikes) => {
        const { error } = await supabase
          .from("flop-or-hit")
          .update({ likes: currentLikes + 1 })
          .eq("id", postId);
      
        if (error) 
        {
          setError(error.message);
        } 
        else 
        {
          const updatedPosts = posts.map((post) =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
          );
          setPosts(updatedPosts);
        }
      };
      

    return (
    <>
      <div className="home-feed-container">
        {error && <p style={{ color: "red"}}>{error}</p>}
        <div className="feed-lane">
            {posts.map((post) => (
                <div key={post.id} className="post-card">
                    <h3>{post.title}</h3>
                    {post.content && <p>{post.content}</p>}
                    {post.image_url && (
                        <img src={post.image_url} alt="Post" className="post-image" />
                    )}
                    <div className="like-section">
                        <button className="like-button" onClick={() => handleLike(post.id, post.likes || 0)}>
                            <span className="material-symbols-rounded">thumb_up</span>
                        </button>
                        <span className="number-of-likes">{post.likes || 0} Likes</span>
                    </div>
                    <div className="comment-section">
                        <textarea placeholder="Add a comment..." rows="1" className="comment-input" value={commentInputs[post.id] || ""} onChange={(e) => handleCommentChange(post.id, e.target.value)} />
                        <button className="comment-button" onClick={() => handleCommentSubmit(post.id)}>Comment</button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </>
  );
}

export default HomeFeed;
