import { useEffect, useRef, useState } from "react";
import "./HomeFeed.css";
import { useNavigate } from "react-router-dom";
import { applyReaction, getAllPosts } from "../../services/service";
import formatTimeAgo from "../../helpers/formatTimeAgo.js";

function HomeFeed({ searchTerm, sortOption }) {
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const busyRef = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPosts = async () => {
            setError("");

            try {
                const postsArray = await getAllPosts();
                setPosts(postsArray);
            } catch (error) {
                setError(error.message);
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
            } else {
                return 0;
            }
        });

    const goToPostDetails = (postId) => {
        navigate(`/post/${postId}`);
    };

    async function handleReaction(postId, reactionType) {
        // Prevent overlapping reaction requests
        if (busyRef.current) return;

        busyRef.current = true;
        setBusy(true);
        setError("");

        try {
            const dataPost = await applyReaction(postId, reactionType);

            setPosts((prevPosts) => {
                return prevPosts.map((post) => {
                    if (post.id === dataPost.id) {
                        return {
                            ...post,
                            likeCount: post.likeCount + dataPost.likeDelta,
                            dislikeCount: post.dislikeCount + dataPost.dislikeDelta
                        };
                    }

                    return post;
                });
            });
        } catch (error) {
            setError(error.message);
        } finally {
            // Always unlock, even if the request fails
            busyRef.current = false;
            setBusy(false);
        }
    }

    return (
        <>
            <div className="home-feed-container">
                {error && <p style={{ color: "red" }}>{error}</p>}

                <div className="feed-lane">
                    {filteredPosts.map((post) => {
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
                                    @{post.username}
                                </p>

                                <h3>{post.title}</h3>

                                {post.content && <p>{post.content}</p>}

                                <div className="like-section">
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReaction(post.id, "like");
                                        }}
                                    >
                                        👍 {post.likeCount} Likes
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReaction(post.id, "dislike");
                                        }}
                                    >
                                        👎 {post.dislikeCount} Dislikes
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
