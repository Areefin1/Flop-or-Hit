import { useEffect, useState } from "react";
import "./EditPost.css";
import { getAllUserPosts, updatePost, deletePost, getPostImageUrl } from "../../services/service";

function EditPost() {
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [removePostImage, setRemovePostImage] = useState(false);

  // READ: Fetch only the logged-in user's posts
  useEffect(() => {
    async function fetchUserPosts() {
      setLoading(true);
      setError("");

      try {
        const postsArray = await getAllUserPosts();
        setPosts(postsArray);

      } catch (error) {
        setError(error.message);
      }
      finally {
        setLoading(false);
      }
    }

    fetchUserPosts();
  }, []);

  // Start editing a post
  function handleEditClick(post) {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content ?? "");
    setError("");
    setEditImageFile(null);
    setRemovePostImage(false);
  }

  // UPDATE: Save changes to the post
  async function handleSaveChanges() {
      const title = editTitle.trim();
      const content = editContent.trim();

      if (!title || busy) return;

      setBusy(true);
      setError("");

      try {
          const existingPost = posts.find(
              (post) => post.id === editingPostId
          );

          // 1. Existing post image path
          const oldImagePath = existingPost?.image_path ?? null;

          // 2. Save post changes
          const dataPost = await updatePost(
              editingPostId,
              title,
              content,
              oldImagePath,
              removePostImage,
              editImageFile
          );

          // 3. Update React state
          setPosts((prevPosts) =>
              prevPosts.map((post) =>
                  post.id === dataPost.id
                      ? {
                          ...post,
                          title: dataPost.title,
                          content: dataPost.content,
                          image_path: dataPost.image_path
                      }
                      : post
              )
          );

          // 4. Exit editing mode
          setEditingPostId(null);
          setEditImageFile(null);
          setRemovePostImage(false);
      } catch (error) {
          setError(error.message);
      } finally {
          setBusy(false);
      }
  }

  // DELETE: Remove a post
  async function handleDelete(postId) {
    if (busy) return;

    const confirmed = window.confirm(
      "Delete this post? Its comments and reactions may also be permanently deleted."
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      const dataPostId = await deletePost(postId);

      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== dataPostId)
      );
    } catch(error) {
        setError(error.message);
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

                {post.image_path && !removePostImage && (
                  <>
                      <img
                          src={getPostImageUrl(post.image_path)}
                          alt={post.title}
                          className="post-image"
                      />

                      <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                              setRemovePostImage(true);
                              setEditImageFile(null);
                          }}
                      >
                          Remove Image
                      </button>
                  </>
                )}

                {post.image_path && removePostImage && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRemovePostImage(false)}
                    >
                        Undo Remove Image
                    </button>
                )}

                <label htmlFor="editImageFile">Replace image (optional)</label>

                <input
                  type="file"
                  id="editImageFile"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;

                    setEditImageFile(file);

                    if (file) {
                        setRemovePostImage(false);
                    }
                }}
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
                  onClick={() => {
                    setEditingPostId(null);
                    setEditImageFile(null);
                    setRemovePostImage(false);
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3>{post.title}</h3>

                {post.content && <p>{post.content}</p>}

                {post.image_path && (
                  <img
                      src={getPostImageUrl(post.image_path)}
                      alt={post.title}
                      className="post-image"
                  />
                )}

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
