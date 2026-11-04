import { useEffect, useState } from "react";
import "./EditPost.css";
import { getAllUserPosts, updatePost, deletePost, getPostImageUrl, uploadPostImage, deletePostImage } from "../../services/service";

function EditPost() {
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);

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

          const oldImagePath = existingPost?.image_path ?? null;

          let newImagePath = undefined;

          // 1. Upload replacement image, if selected
          if (editImageFile) {
              newImagePath = await uploadPostImage(editImageFile);
          }

          // 2. Update database
          const dataPost = await updatePost(
              editingPostId,
              title,
              content,
              newImagePath
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

          // 5. Delete old image after successful replacement
          if (newImagePath && oldImagePath) {
              try {
                  await deletePostImage(oldImagePath);
              } catch (cleanupError) {
                  console.error(
                      "Post updated, but old image cleanup failed:",
                      cleanupError
                  );
              }
          }

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
                <label htmlFor="editImageFile">Replace image (optional)</label>

                <input
                  type="file"
                  id="editImageFile"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
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
