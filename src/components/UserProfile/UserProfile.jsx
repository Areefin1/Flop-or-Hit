import { useEffect, useState } from "react";
import { getAllUserPosts, getAvatarImageUrl, getMyProfile, getPostImageUrl } from "../../services/service";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css";

function UserProfile()
{
    const [profileData, setProfileData] = useState({});
    const [error, setError] = useState("");
    const [posts, setPosts] = useState([]);
    const navigate = useNavigate();

    const goToPostDetails = (postId) => {
        navigate(`/post/${postId}`);
    };

    useEffect(() => {
        async function fetchUserPosts()
        {
            try {
                const postsArray = await getAllUserPosts();
                setPosts(postsArray);
            } catch (error) {
                setError(error.message);
            }
        }
        async function fetchUserProfile()
        {
            try {
                const data = await getMyProfile();

                setProfileData(data);
            } catch (error) {
                setError(error.message);
            }
        }

        fetchUserProfile();
        fetchUserPosts();
    }, []);

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
                <button 
                type="button"
                onClick={() => navigate("/profile/edit")}
                >
                    Edit Profile
                </button>
            </div>
            <div className="post-grid">
                {posts.map((post) => (
                    <div 
                    key={post.id} 
                    className="post-card"
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
                            <span>👍 {post.likeCount} Likes</span>
                            <span>👎 {post.dislikeCount} Dislikes</span>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

export default UserProfile;