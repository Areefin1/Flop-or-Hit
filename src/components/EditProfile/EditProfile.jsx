import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, getAvatarImageUrl, updateProfile } from "../../services/service";
import "./EditProfile.css";

function EditProfile()
{
    const [currentAvatarPath, setCurrentAvatarPath] = useState(null);
    const [editImageProfile, setEditImageProfile] = useState(null);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchUserProfile()
        {
            try {
                const data = await getMyProfile();

                setEditDisplayName(data.display_name);
                setEditBio(data.bio ?? "");
                setCurrentAvatarPath(data.avatar_path)
            } catch (error) {
                setError(error.message);
            }
            finally {
                setLoading(false);
            }
        }
        fetchUserProfile();
    }, []);

    async function handleSaveChanges()
    {
        if (saving) return;

        setSaving(true);
        setError("");

        try {
            if (!editDisplayName.trim()) {
                throw new Error("Display name cannot be empty.");
            }

            await updateProfile({
                displayName: editDisplayName.trim(),
                bio: editBio,
                oldImagePath: currentAvatarPath,
                newAvatar: editImageProfile
            });
       
            navigate("/profile");

        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
    }
}
    
    return (
        <div className="edit-profile">
            {error && <p className="error-message">{error}</p>}
            <h2>Edit Profile</h2>
            <div className="change-profile-picture">
                {currentAvatarPath && (
                    <img
                        src={getAvatarImageUrl(currentAvatarPath)}
                        alt="Current profile avatar"
                        className="profile-picture"
                    />
                )}
                <label htmlFor="editImageProfile">Change Photo (optional)</label>
                <input
                  type="file"
                  id="editImageProfile"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setEditImageProfile(e.target.files?.[0] ?? null)}
                />
            </div>
            <div className="edit-profile-field">
                <label htmlFor="editDisplayName">Display Name</label>
                <input
                    id="editDisplayName"
                    type="text"
                    maxLength={50}
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                />
            </div>
            <div className="edit-profile-field">
                <label htmlFor="editBio">Bio</label>
                <textarea
                    id="editBio"
                    maxLength={300}
                    value={editBio}
                    placeholder="Tell people a little about yourself..."
                    onChange={(e) => setEditBio(e.target.value)}
                />
            </div>
            <div className="edit-profile-actions">
                <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving || loading || !!error}
                    className="save-button"
                    >
                    {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="cancel-button"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default EditProfile;