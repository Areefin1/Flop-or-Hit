
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./PostDetails.css";
import { addComment, 
  applyCommentReaction, 
  getSpecificPost, 
  updateComment, 
  deleteComment 
} from "../../services/service";

function PostDetails() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // READ: Fetch the post and its reactions
  async function fetchPost() {
      try {
        const dataPost = await getSpecificPost(postId);

        setPost(dataPost);
      } catch (error) {
        setError(error.message);
      }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
        setLoading(true);
        setError("");
        setPost(null);

        try {
            const dataPost = await getSpecificPost(postId);

            if (!cancelled) {
                setPost(dataPost);
            }
        } catch (error) {
            if (!cancelled) {
                setError(error.message);
            }
        } finally {
            if (!cancelled) {
                setLoading(false);
            }
        }
    }

    loadPage();

    return () => {
        cancelled = true;
    };
}, [postId]);

  // CREATE: Add a comment
  async function handleCommentSubmit() {
    const content = commentInput.trim();

    if (!content || busy) return;

    setBusy(true);
    setError("");

    try {
      const data = await addComment(postId, content);

      setPost(prevPost => ({
        ...prevPost, 
        comments: [data, ...prevPost.comments]
      }));
      setCommentInput("");
    } catch (error) {
        setError(error.message);
    }
     finally {
      setBusy(false);
    }
  }

  async function handleCommentReaction(commentId, reactionType) {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
        const dataComment = await applyCommentReaction(commentId, reactionType);
        setPost(prevPost => ({
            ...prevPost,
            comments: prevPost.comments.map(comment => {
                if (comment.id === dataComment.id) {
                    return {
                        ...comment,
                        likeCount: comment.likeCount + dataComment.likeDelta,
                        dislikeCount: comment.dislikeCount + dataComment.dislikeDelta
                    };
                }
                return comment;
            })
        }));
    } catch (error) {
        setError(error.message);
    }
     finally {
      setBusy(false);
    }
  }

  // Start editing a comment
  function startEditing(comment) {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  }

  // UPDATE: Save an edited comment
  async function handleCommentUpdate(commentId) {
    const content = editingContent.trim();

    if (!content || busy) return;

    setBusy(true);
    setError("");

    try {
        const data = await updateComment(commentId, content);

        setPost(prevPost => ({
          ...prevPost,
          comments: prevPost.comments.map(comment => {
              if (comment.id === data.id) {
                  return {
                      ...comment,
                      content: data.content
                  };
              }
              return comment;
          })
      }));

      setEditingCommentId(null);
      setEditingContent("");
    } catch (error) 
    {
        setError(error.message);
    }
    finally {
      setBusy(false);
    }
  }
  // DELETE: Remove a comment
  async function handleCommentDelete(commentId) {
    if (busy) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      const data = await deleteComment(commentId);

      setPost(prevPost => ({
        ...prevPost,
        comments: prevPost.comments.filter(comment =>
            (comment.id !== data.id)
          )
      }));
    } catch(error) {
        setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p>Loading post...</p>;
  }

  if (!post) {
    return (
      <div className="post-details-container">
        <p>{error || "Post not found."}</p>
      </div>
    );
  }

  return (
    <div className="post-details-container">
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="post-details-card">
        <p>@{post.username}</p>

        <h3>{post.title}</h3>

        {post.content && <p>{post.content}</p>}

        <div className="like-section">
          <span>👍 {post.likeCount} Likes</span>
          <span>👎 {post.dislikeCount} Dislikes</span>
        </div>
      </div>

      <div className="comment-section">
        <h4>Comments ({post.comments.length})</h4>

        <div className="comments-list">
          {post.comments.length === 0 && (
            <p>No comments yet. Be the first!</p>
          )}

          {post.comments.map((comment) => {
            const isEditing = editingCommentId === comment.id;

            return (
              <div key={comment.id} className="comment-item">
                <p>
                  <strong>
                    @{comment.username ?? "Unknown"}
                  </strong>
                </p>

                {isEditing ? (
                  <>
                    <textarea
                      className="comment-input"
                      value={editingContent}
                      onChange={(e) =>
                        setEditingContent(e.target.value)
                      }
                    />

                    <button
                      type="button"
                      disabled={busy || !editingContent.trim()}
                      onClick={() => handleCommentUpdate(comment.id)}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingContent("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <p>{comment.content}</p>

                    {comment.isOwner && (
                      <div className="comment-actions">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startEditing(comment)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleCommentDelete(comment.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    <div className="comment-reactions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleCommentReaction(comment.id, "like")}
                    >
                      👍 {comment.likeCount}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleCommentReaction(comment.id, "dislike")}
                    >
                      👎 {comment.dislikeCount}
                    </button>
                  </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <textarea
          placeholder="Add a comment..."
          rows={2}
          className="comment-input"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
        />

        <button
          type="button"
          className="comment-button"
          disabled={busy || !commentInput.trim()}
          onClick={handleCommentSubmit}
        >
          {busy ? "Please wait..." : "Comment"}
        </button>
      </div>
    </div>
  );
}

export default PostDetails;
