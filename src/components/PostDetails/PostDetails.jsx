
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import formatTimeAgo from "../../helpers/formatTimeAgo";
import "./PostDetails.css";
import { addComment, 
  applyCommentReaction, 
  getSpecificPost, 
  updateComment, 
  deleteComment,
  getPostImageUrl,
  getAvatarImageUrl,
  applyReaction 
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

  const navigate = useNavigate();

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

  async function handlePostReaction(reactionType) {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
        const dataPost = await applyReaction(postId, reactionType);

        setPost(prevPost => ({
            ...prevPost,
            likeCount: prevPost.likeCount + dataPost.likeDelta,
            dislikeCount: prevPost.dislikeCount + dataPost.dislikeDelta
        }));

    } catch (error) {
        setError(error.message);
    } finally {
        setBusy(false);
    }
  }

  return (
    <div className="post-details-container">
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="post-details-card">
          <div
              className="post-author-header"
              onClick={() => navigate(`/users/${post.user_id}`)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                  if (e.key === "Enter") {
                      navigate(`/users/${post.user_id}`);
                  }
              }}
          >
              <img
                  src={getAvatarImageUrl(post.avatar_path)}
                  alt={`${post.username}'s avatar`}
                  className="post-avatar"
              />

              <div className="post-author-info">
                  <span className="post-display-name">
                      {post.display_name || post.username || "Unknown User"}
                  </span>

                  <span className="post-username">
                      @{post.username || "unknown"}
                  </span>

                  <span className="post-time">
                      {formatTimeAgo(post.created_at)}
                  </span>
              </div>
          </div>

        <h3>{post.title}</h3>

        {post.content && <p>{post.content}</p>}

        {post.image_path && (
            <img 
                src={getPostImageUrl(post.image_path)}
                alt={post.title}
                className="post-image"
            />
        )}

        <div className="like-section">
          <button
              type="button"
              disabled={busy}
              onClick={() => handlePostReaction("like")}
          >
              <span className="material-symbols-outlined reaction-icon">
                  thumb_up
              </span>
              <span>{post.likeCount}</span>
          </button>

          <button
              type="button"
              disabled={busy}
              onClick={() => handlePostReaction("dislike")}
          >
              <span className="material-symbols-outlined reaction-icon">
                  thumb_down
              </span>
              <span>{post.dislikeCount}</span>
          </button>
            <span className="comment-count" aria-label={`${post.commentCount} comments`}>
                <span className="material-symbols-outlined reaction-icon" aria-hidden="true">
                    mode_comment
                </span>
                <span>{post.comments.length}</span>
            </span>

        </div>
      </div>

      <div className="comment-section">
        <h4>Comments ({post.comments.length})</h4>
            <div className="comment-composer">
        <textarea
            placeholder="Add a comment..."
            rows={3}
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
        <div className="comments-list">
          {post.comments.length === 0 && (
            <p>No comments yet. Be the first!</p>
          )}

          {post.comments.map((comment) => {
            const isEditing = editingCommentId === comment.id;

            return (
              <div key={comment.id} className="comment-item">
                <div
                    className="comment-author-header"
                    onClick={() => navigate(`/users/${comment.user_id}`)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            navigate(`/users/${comment.user_id}`);
                        }
                    }}
                >
                    <img
                        src={getAvatarImageUrl(comment.avatar_path)}
                        alt={`${comment.display_name || comment.username || "User"}'s avatar`}
                        className="comment-avatar"
                    />

                    <div className="comment-author-info">
                        <span className="comment-display-name">
                            {comment.display_name || comment.username || "Unknown User"}
                        </span>

                        <span className="comment-time">
                            {formatTimeAgo(comment.created_at)}
                        </span>
                    </div>
                </div>

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

                    
                      <div className="comment-footer">
                          <div className="comment-reactions">
                              <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleCommentReaction(comment.id, "like")}
                              >
                                  <span className="material-symbols-outlined reaction-icon">
                                      thumb_up
                                  </span>
                                  <span>{comment.likeCount}</span>
                              </button>

                              <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleCommentReaction(comment.id, "dislike")}
                              >
                                  <span className="material-symbols-outlined reaction-icon">
                                      thumb_down
                                  </span>
                                  <span>{comment.dislikeCount}</span>
                              </button>
                          </div>

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
                                      onClick={() => handleCommentDelete(comment.id)}
                                  >
                                      Delete
                                  </button>
                              </div>
                          )}
                      </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PostDetails;
