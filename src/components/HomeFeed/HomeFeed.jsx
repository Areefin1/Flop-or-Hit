import React, { useEffect, useState } from "react";
import { supabase } from "../../client"; // Adjust the path to your client
import "./HomeFeed.css";
import { useNavigate } from "react-router-dom";

function HomeFeed({ searchTerm, sortOption }) 
{ 
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    
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

    const filteredPosts = posts
  .filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => {
    if (sortOption === "latest") {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortOption === "oldest") {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (sortOption === "most upvoted") {
      return (b.likes || 0) - (a.likes || 0);
    } else {
      return 0;
    }
  });

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

    const goToPostDetails = (postId) => {
        navigate(`/post/${postId}`);
    }

    const formatTimeAgo = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000); // difference in seconds
    
      if (diff < 60) return `${diff} seconds ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      return `${Math.floor(diff / 86400)} days ago`;
    };
    
      

    return (
    <>
      <div className="home-feed-container">
        {error && <p style={{ color: "red"}}>{error}</p>}
        <div className="feed-lane">
            {filteredPosts.map((post) => (
                <div key={post.id} className="post-card" onClick={() => goToPostDetails(post.id)} style={{ cursor: "pointer" }}>
                    <div className="post-time">{formatTimeAgo(post.created_at)}</div>
                    <h3>{post.title}</h3>
                    {post.image_url && (
                        <img src={post.image_url} alt="Post" className="post-image" />
                    )}
                    <div className="like-section" onClick={(e) => e.stopPropagation()}>
                        <button className="like-button" onClick={() => handleLike(post.id, post.likes || 0)}>
                            <span className="material-symbols-rounded">thumb_up</span>
                        </button>
                        <span className="number-of-likes">{post.likes || 0} Likes</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </>
  );
}

export default HomeFeed;
