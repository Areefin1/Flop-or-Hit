import { useEffect, useRef, useState } from "react";
import "./HomeFeed.css";
import { useNavigate } from "react-router-dom";
import { applyReaction, getAllPosts, getPostImageUrl, getAvatarImageUrl } from "../../services/service";
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

    const goToUserProfile = (userId) => {
        navigate(`/users/${userId}`);
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

                            <div
                                className="post-author-header"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToUserProfile(post.user_id);
                                }}
                                role="link"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.stopPropagation();
                                        goToUserProfile(post.user_id);
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReaction(post.id, "like");
                                        }}
                                    >
                                    <span className="material-symbols-outlined reaction-icon">
                                        thumb_up
                                    </span>
                                    <span>{post.likeCount}</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReaction(post.id, "dislike");
                                        }}
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
                                        <span>{post.commentCount}</span>
                                    </span>
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
