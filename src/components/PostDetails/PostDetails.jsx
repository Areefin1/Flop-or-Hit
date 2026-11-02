
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../client";
import "./PostDetails.css";

function PostDetails() {
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // READ: Fetch the post and its reactions
  async function fetchPost() {
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
      .eq("id", postId)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setPost(data);
    }
  }

  // READ: Fetch comments and their authors
  async function fetchComments() {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        post_id,
        user_id,
        content,
        created_at,
        profiles!comments_user_id_fkey (
          username,
          display_name
        ),
        comment_reactions (
          user_id,
          reaction
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setComments(data ?? []);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setError("");
      setPost(null);
      setComments([]);

      const { data: userData } = await supabase.auth.getUser();

      if (!cancelled) {
        setCurrentUserId(userData.user?.id ?? null);
      }

      await Promise.all([fetchPost(), fetchComments()]);

      if (!cancelled) {
        setLoading(false);
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
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("You must be logged in to comment.");
        return;
      }

      const { error: insertError } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: userData.user.id,
          content: content
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setCommentInput("");
      await fetchComments();
    } finally {
      setBusy(false);
    }
  }

  
  async function handleCommentReaction(commentId, reactionType) {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("You must be logged in to react.");
        return;
      }

      const currentUserId = userData.user.id;

      const comment = comments.find(
        (comment) => comment.id === commentId
      );

      if (!comment) {
        setError("Comment not found.");
        return;
      }

      const existingReaction = (
        comment.comment_reactions ?? []
      ).find(
        (reaction) => reaction.user_id === currentUserId
      );

      // INSERT: No reaction exists
      if (!existingReaction) {
        const { error } = await supabase
          .from("comment_reactions")
          .insert({
            user_id: currentUserId,
            comment_id: commentId,
            reaction: reactionType
          });

        if (error) {
          setError(error.message);
          return;
        }
      }

      // DELETE: Same reaction clicked again
      else if (existingReaction.reaction === reactionType) {
        const { error } = await supabase
          .from("comment_reactions")
          .delete()
          .eq("user_id", currentUserId)
          .eq("comment_id", commentId);

        if (error) {
          setError(error.message);
          return;
        }
      }

      // UPDATE: Switch between like and dislike
      else {
        const { error } = await supabase
          .from("comment_reactions")
          .update({ reaction: reactionType })
          .eq("user_id", currentUserId)
          .eq("comment_id", commentId);

        if (error) {
          setError(error.message);
          return;
        }
      }

      // Refresh comments to show updated reaction counts
      await fetchComments();
    } finally {
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
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("You must be logged in.");
        return;
      }

      const { data, error: updateError } = await supabase
        .from("comments")
        .update({ content: content })
        .eq("id", commentId)
        .eq("user_id", userData.user.id)
        .select("id");

      if (updateError) {
        setError(updateError.message);
        return;
      }

      if (!data?.length) {
        setError("Comment not found or you cannot edit it.");
        return;
      }

      setEditingCommentId(null);
      setEditingContent("");
      await fetchComments();
    } finally {
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
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("You must be logged in.");
        return;
      }

      const { data, error: deleteError } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userData.user.id)
        .select("id");

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      if (!data?.length) {
        setError("Comment not found or you cannot delete it.");
        return;
      }

      await fetchComments();
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

  const reactions = post.post_reactions ?? [];

  const likeCount = reactions.filter(
    (reaction) => reaction.reaction === "like"
  ).length;

  const dislikeCount = reactions.filter(
    (reaction) => reaction.reaction === "dislike"
  ).length;

  return (
    <div className="post-details-container">
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="post-details-card">
        <p>@{post.profiles?.username}</p>

        <h3>{post.title}</h3>

        {post.content && <p>{post.content}</p>}

        <div className="like-section">
          <span>👍 {likeCount} Likes</span>
          <span>👎 {dislikeCount} Dislikes</span>
        </div>
      </div>

      <div className="comment-section">
        <h4>Comments ({comments.length})</h4>

        <div className="comments-list">
          {comments.length === 0 && (
            <p>No comments yet. Be the first!</p>
          )}

          {comments.map((comment) => {
            const isOwner = comment.user_id === currentUserId;
            const isEditing = editingCommentId === comment.id;

            const reactions = comment.comment_reactions ?? [];

            const likeCount = reactions.filter(
              (reaction) => reaction.reaction === "like"
            ).length;

            const dislikeCount = reactions.filter(
              (reaction) => reaction.reaction === "dislike"
            ).length;

            return (
              <div key={comment.id} className="comment-item">
                <p>
                  <strong>
                    @{comment.profiles?.username ?? "Unknown"}
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

                    {isOwner && (
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
                      👍 {likeCount}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleCommentReaction(comment.id, "dislike")}
                    >
                      👎 {dislikeCount}
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
