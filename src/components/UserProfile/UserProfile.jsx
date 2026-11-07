import { useEffect, useState } from "react";
import { getAllPosts, getAvatarImageUrl, getProfile, getPostImageUrl } from "../../services/service";
import getAuthUserData from "../../services/userData";
import { useNavigate, useParams } from "react-router-dom";
import "./UserProfile.css";

function UserProfile()
{
    const [profileData, setProfileData] = useState({});
    const [currentUser, setCurrentUser] = useState({});
    const [error, setError] = useState("");
    const [posts, setPosts] = useState([]);
    const navigate = useNavigate();
    const { userId } = useParams();
    const goToPostDetails = (postId) => {
        navigate(`/post/${postId}`);
    };
    
    useEffect(() => {
        async function fetchUserProfileAndPosts() {
            try {
                setError("");
                setProfileData({});
                setPosts([]);

                let targetUserId = userId;
                const user = await getAuthUserData();
                setCurrentUser(user);

                if (!targetUserId) 
                { 
                    targetUserId = user.id;
                }

                const [profile, postsArray] = await Promise.all([
                    getProfile(targetUserId),
                    getAllPosts(targetUserId)
                ]);
                
                if (!profile) 
                {
                    setError("This user profile does not exist.");
                    setProfileData({});
                    setPosts([]);
                    return;
                }

                setProfileData(profile);
                setPosts(postsArray);

            } catch (error) {
                setError(error.message);
            }
        }

        fetchUserProfileAndPosts();
    }, [userId]);

    return (
        <>
            <div className="profile-banner">
                {error && <p className="error-message">{error}</p>}
                <img 
                    src={getAvatarImageUrl(profileData.avatar_path)}
                    alt={`${profileData.display_name}'s avatar`}
                    className="profile-picture"
                />
                <h4>{profileData.display_name}</h4>
                <h5>@{profileData.username}</h5>
                {profileData.bio && (
                    <p>{profileData.bio}</p>
                )}

                {profileData.id === currentUser.id && (
                <button 
                type="button"
                onClick={() => navigate("/profile/edit")}
                >
                    Edit Profile
                </button>
                )}
            </div>
            <div className="profile-post-grid">
                {posts.map((post) => (
                    <div 
                    key={post.id} 
                    className="profile-post-card"
                    onClick={() => goToPostDetails(post.id)}
                    style={{cursor: "pointer"}}
                    >
                        <h3>{post.title}</h3>
                        {post.content && <p>{post.content}</p>}
                        {post.image_path && (
                            <img 
                                src={getPostImageUrl(post.image_path)}
                                alt={post.title}
                                className="post-card-image"
                            />
                        )}
                        <div className="like-section">
                            <span className="material-symbols-outlined reaction-icon">
                                thumb_up
                            </span>
                            <span>{post.likeCount}</span>
                            <span className="material-symbols-outlined reaction-icon">
                                thumb_down
                            </span>
                            <span>{post.dislikeCount}</span>
                            <span className="comment-count" aria-label={`${post.commentCount} comments`}>
                                <span className="material-symbols-outlined reaction-icon" aria-hidden="true">
                                    mode_comment
                                </span>
                                    <span>{post.commentCount}</span>
                                </span>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

export default UserProfile;