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
          setError("");
        const { data, error } = await supabase
            .from("posts")
            .select(`
                    id,
                    user_id,
                    title,
                    content,
                    image_path,
                    created_at,
                    profiles!posts_user_id_fkey (
                    username,
                    display_name
                    ),
                    post_reactions (
                      user_id,
                      reaction
                    )
                  `)
            .order("created_at", { ascending: false });

            if(error)
            {
                setError(error.message);
            }
            else
            {
                setPosts(data ?? []);
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
    } 
    /*
    else if (sortOption === "most upvoted") {
      return (b.likes || 0) - (a.likes || 0);
    } 
    */  
    else {
      return 0;
    }
  });

    /*
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

      */

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


    async function handleReaction(postId, reactionType) {
      setError("");

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("You must be logged in to react.");
        return;
      }

      const currentUserId = userData.user.id;

      const post = posts.find((post) => post.id === postId);

      if (!post) {
        setError("Post not found.");
        return;
      }

      const existingReaction = (post.post_reactions ?? []).find(
        (reaction) => reaction.user_id === currentUserId
      );

      // CASE 1: No reaction exists → INSERT
      if (!existingReaction) {
        const { error: insertError } = await supabase
          .from("post_reactions")
          .insert({
            user_id: currentUserId,
            post_id: postId,
            reaction: reactionType
          });

        if (insertError) {
          setError(insertError.message);
          return;
        }
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    post_reactions: [
                      ...(post.post_reactions ?? []),
                      { user_id: currentUserId, reaction: reactionType }
                    ]
                  }
                : post
            )
          );
      }

      // CASE 2: Same reaction clicked → DELETE
      else if (existingReaction.reaction === reactionType) {
        const { error: deleteError } = await supabase
          .from("post_reactions")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", postId);

        if (deleteError) {
          setError(deleteError.message);
          return;
        }
            setPosts((prevPosts) =>
              prevPosts.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      post_reactions: (post.post_reactions ?? []).filter(
                        (reaction) => reaction.user_id !== currentUserId
                      )
                    }
                  : post
              )
            );
      }

      // CASE 3: Opposite reaction clicked → UPDATE
      else {
        const { error: updateError } = await supabase
          .from("post_reactions")
          .update({ reaction: reactionType })
          .eq("user_id", currentUserId)
          .eq("post_id", postId);

        if (updateError) {
          setError(updateError.message);
          return;
        }
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  post_reactions: (post.post_reactions ?? []).map(
                    (reaction) =>
                      reaction.user_id === currentUserId
                        ? { ...reaction, reaction: reactionType }
                        : reaction
                  )
                }
              : post
          )
        );
      }
    }

    return (
    <>
      <div className="home-feed-container">
        {error && <p style={{ color: "red"}}>{error}</p>}
        <div className="feed-lane">
            {filteredPosts.map((post) => {
              const reactions = post.post_reactions ?? [];

              const likeCount = reactions.filter(
                (reaction) => reaction.reaction === "like"
              ).length;

              const dislikeCount = reactions.filter(
                (reaction) => reaction.reaction === "dislike"
              ).length;

              return (
                <div
                  key={post.id}
                  className="post-card"
                  onClick={() => goToPostDetails(post.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="post-time">
                    {formatTimeAgo(post.created_at)}
                  </div>

                  <p className="post-author">
                    @{post.profiles?.username}
                  </p>

                  <h3>{post.title}</h3>

                  {post.content && <p>{post.content}</p>}
                    <div className="like-section">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(post.id, "like");
                        }}
                      >
                        👍 {likeCount} Likes
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(post.id, "dislike");
                        }}
                      >
                        👎 {dislikeCount} Dislikes
                      </button>
                    </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

export default HomeFeed;
