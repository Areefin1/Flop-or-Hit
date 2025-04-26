import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../client";
import "./PostDetails.css";

function PostDetails() {
  const [commentInput, setCommentInput] = useState("");
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const { postId } = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("flop-or-hit")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setPost(data);
      }
    };

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from("comments")
            .select("*")
            .eq("post_id", postId)
            .order("created_at", { ascending: false });
        
        if(error)
        {
            setError(error.message);
        }
        else
        {
            setComments(data);
        }
    };

    fetchPost();
    fetchComments();
  }, [postId]);

  const handleLike = async () => {
    const { error } = await supabase
      .from("flop-or-hit")
      .update({ likes: post.likes + 1 })
      .eq("id", post.id);

    if (error) {
      setError(error.message);
    } else {
      setPost((prevPost) => ({ ...prevPost, likes: prevPost.likes + 1 }));
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentInput.trim()) return;

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("comments").insert([
      {
        content: commentInput,
        post_id: post.id,
        user_id: userData.user.id,
      },
    ]);

    if (error) 
    {
      setError(error.message);
    } else 
    {
      setCommentInput("");

      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", {  ascending: false });
      setComments(data);
    }
  };

  if (!post) {
    return <p>Loading post...</p>;
  }

  return (
    <>
      <div className="post-details-container">
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className="post-details-card">
          <h3>{post.title}</h3>
          {post.content && <p>{post.content}</p>}
          {post.image_url && (
            <img src={post.image_url} alt="Post" className="post-image" />
          )}
          <div className="like-section">
            <button className="like-button" onClick={handleLike}>
              <span className="material-symbols-rounded">thumb_up</span>
            </button>
            <span className="number-of-likes">{post.likes || 0} Likes</span>
          </div>
        </div>
          <div className="comment-section">
            <h4>Comments:</h4>
            <div className="comments-list">
                {comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                        {comment.content}
                    </div>
                ))}
            </div>
            <textarea
              placeholder="Add a comment..."
              rows="1"
              className="comment-input"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button className="comment-button" onClick={handleCommentSubmit}>
              Comment
            </button>
          </div>
      </div>
    </>
  );
}

export default PostDetails;
