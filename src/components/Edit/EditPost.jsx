
import { useEffect, useState } from "react";
import { supabase } from "../../client";
import "./EditPost.css";

function EditPost() {
  const [posts, setPosts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // READ: Fetch only the logged-in user's posts
  useEffect(() => {
    async function fetchUserPosts() {
      setLoading(true);
      setError("");

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      const userId = userData.user.id;
      setCurrentUserId(userId);

      const { data, error: fetchError } = await supabase
        .from("posts")
        .select("id, user_id, title, content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPosts(data ?? []);
      }

      setLoading(false);
    }

    fetchUserPosts();
  }, []);

  // Start editing a post
  function handleEditClick(post) {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content ?? "");
    setError("");
  }

  // UPDATE: Save changes to the post
  async function handleSaveChanges() {
    const title = editTitle.trim();
    const content = editContent.trim();

    if (!title || busy || !currentUserId) return;

    setBusy(true);
    setError("");

    try {
      const { data, error: updateError } = await supabase
        .from("posts")
        .update({
          title: title,
          content: content || null
        })
        .eq("id", editingPostId)
        .eq("user_id", currentUserId)
        .select("id");

      if (updateError) {
        setError(updateError.message);
        return;
      }

      if (!data?.length) {
        setError("Post not found or you cannot edit it.");
        return;
      }

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === editingPostId
            ? { ...post, title, content: content || null }
            : post
        )
      );

      setEditingPostId(null);
    } finally {
      setBusy(false);
    }
  }

  // DELETE: Remove a post
  async function handleDelete(postId) {
    if (busy || !currentUserId) return;

    const confirmed = window.confirm(
      "Delete this post? Its comments and reactions may also be permanently deleted."
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      const { data, error: deleteError } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", currentUserId)
        .select("id");

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      if (!data?.length) {
        setError("Post not found or you cannot delete it.");
        return;
      }

      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== postId)
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p>Loading your posts...</p>;
  }

  return (
    <div className="edit-post-container">
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="post-grid">
        {posts.length === 0 && (
          <p>You haven't created any posts yet.</p>
        )}

        {posts.map((post) => (
          <div key={post.id} className="edit-post-card">
            {editingPostId === post.id ? (
              <>
                <input
                  type="text"
                  maxLength={100}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />

                <textarea
                  rows={3}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />

                <button
                  type="button"
                  disabled={busy || !editTitle.trim()}
                  onClick={handleSaveChanges}
                >
                  {busy ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditingPostId(null)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3>{post.title}</h3>

                {post.content && <p>{post.content}</p>}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleEditClick(post)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  disabled={busy}
                  onClick={() => handleDelete(post.id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EditPost;
