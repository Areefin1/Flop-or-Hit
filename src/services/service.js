import { supabase } from "../client";
import getAuthUserData from "./userData";
import countReactions from "./countReaction";
import { deleteImage, uploadImage, getImageUrl } from "./storageService";


async function createPost(title, content, image_path = null)
{
    try {
        const user = await getAuthUserData();

        const { error: insertError } = await supabase
            .from("posts")
            .insert([{
                title: title,
                content: content,
                user_id: user.id,
                image_path: image_path
            }]);

        if(insertError)
        {
            throw new Error(`Database INSERT error: ${insertError.message}`);
        }
    } catch (error) {
        throw new Error(`Failed to create a new post: ${error.message}`)
    }
}

// Avatars wrapper functions
const uploadAvatar = (file) =>
    uploadImage("avatars", file);

const getAvatarImageUrl = (imagePath) =>
    getImageUrl("avatars", imagePath);

const deleteAvatar = (imagePath) =>
    deleteImage("avatars", imagePath);

// Post images wrapper functions
const uploadPostImage = (file) =>
    uploadImage("post-images", file);

const deletePostImage = (imagePath) =>
    deleteImage("post-images", imagePath);


const getPostImageUrl = (imagePath) =>
    getImageUrl("post-images", imagePath);

async function getAllUserPosts()
{
    const user = await getAuthUserData();

    return getAllPosts(user.id);
}

async function updatePost(postId, title, content, oldImagePath, removePostImage, imageFile = undefined)
{
    try {
        const user = await getAuthUserData();

        const updates = {
            title: title,
            content: content
        };

        let newImagePath = undefined;

        if (imageFile) {
            newImagePath = await uploadPostImage(imageFile);
            updates.image_path = newImagePath;
        }

        if(removePostImage)
        {
            updates.image_path = null;
        }

        // 2. Update the database
        let data;

        try {
            const { data: updatedPost, error: updateError } = await supabase
                .from("posts")
                .update(updates)
                .eq("user_id", user.id)
                .eq("id", postId)
                .select("id, title, content, image_path, created_at")
                .single();

            if (updateError)
            {
                throw new Error(`Database UPDATE error: ${updateError.message}`);
            }

            data = updatedPost;

        } catch (updateError) {

            // Database failed: delete newly uploaded post image
            if (newImagePath)
            {
                try {
                    await deletePostImage(newImagePath);
                } catch (cleanupError) {
                    console.error(
                        "Failed to clean up newly uploaded post image:",
                        cleanupError
                    );
                }
            }

            throw updateError;
        }

        // 3. Database succeeded: delete old post image
        if ((newImagePath || removePostImage) && oldImagePath)
        {
            try {
                await deletePostImage(oldImagePath);
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up old uploaded post image:",
                    cleanupError
                );
            }
        }

        return data;
    } catch (error) {
        throw new Error(`Post not found or you cannot edit it: ${error.message}`);
    }
}


async function deletePost(postId) {
    try {
        const user = await getAuthUserData();

        // 1. Find the post and its image path.
        const { data: post, error: fetchError } = await supabase
            .from("posts")
            .select("id, image_path")
            .eq("id", postId)
            .eq("user_id", user.id)
            .single();

        if (fetchError) {
            throw new Error(`Database SELECT error: ${fetchError.message}`);
        }

        // 2. Delete the database row.
        const { data, error: deleteError } = await supabase
            .from("posts")
            .delete()
            .eq("id", postId)
            .eq("user_id", user.id)
            .select("id")
            .single();

        if (deleteError) {
            throw new Error(`Database DELETE error: ${deleteError.message}`);
        }

        // 3. Clean up the associated image, if one exists.
        if (post.image_path) {
            try {
                await deletePostImage(post.image_path);
            } catch (imageError) {
                console.error(
                    "Post deleted, but image cleanup failed:",
                    imageError
                );
            }
        }

        return data.id;

    } catch (error) {
        throw new Error(`Failed to delete post: ${error.message}`);
    }
}


async function getAllPosts(userId = null)
{
    try
    {
        let query = supabase
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
                    display_name,
                    avatar_path
                ),
                post_reactions (
                    reaction
                ),
                comments(count)
            `)
            .order("created_at", { ascending: false });

        if(userId !== null)
        {
            query = query.eq("user_id", userId);
        }

        const { data, error } = await query;

        if(error)
        {
            throw new Error(`Database SELECT error: ${error.message}`);
        }

        return (data ?? []).map((post) => {
            const { profiles, post_reactions, comments, ...postData } = post;

            return {
                ...postData,
                username: profiles?.username ?? null,
                display_name: profiles?.display_name ?? null,
                avatar_path: profiles?.avatar_path ?? null,
                commentCount: comments?.[0]?.count ?? 0,
                ...countReactions(post_reactions)
            };
        });

    }
    catch(error)
    {
        throw new Error(`Failed to get posts: ${error.message}`);
    }
}

async function applyReaction(postId, reactionType) {
    try {
        const user = await getAuthUserData();

        // Check whether the post exists
        const { data: existingPost, error: postError } = await supabase
            .from("posts")
            .select("id")
            .eq("id", postId)
            .maybeSingle();

        if (postError) {
            throw new Error(`Failed to check post: ${postError.message}`);
        }

        if (!existingPost) {
            throw new Error("Post does not exist.");
        }

        // Check whether this user has already reacted
        const { data: existingReaction, error: reactionError } = await supabase
            .from("post_reactions")
            .select("reaction")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (reactionError) {
            throw new Error(`Failed to retrieve reaction: ${reactionError.message}`);
        }

        // Your reaction logic goes here.

        let likeDelta;
        let dislikeDelta;

        if(!existingReaction)
        {
            const row = {user_id: user.id, post_id: postId, reaction: reactionType};

            const { data, error: insertError } = await supabase
                .from("post_reactions")
                .insert(row)
                .select("post_id, reaction")
                .single();
            
            if(insertError)
            {
                throw new Error(`Database INSERT error: ${insertError.message}`);
            }

            if(data.reaction === "like")
            {
                likeDelta = 1;
                dislikeDelta = 0;
            }
            else if(data.reaction === "dislike")
            {
                likeDelta = 0;
                dislikeDelta = 1;
            }

            return {id: data.post_id, likeDelta: likeDelta, dislikeDelta: dislikeDelta};
        }
        else if(existingReaction.reaction === reactionType)
        {
            const { data, error: deleteError } = await supabase
                .from("post_reactions")
                .delete()
                .eq("user_id", user.id)
                .eq("post_id", postId)
                .select("post_id, reaction")
                .single();

            if(deleteError)
            {
                throw new Error(`Database DELETE error: ${deleteError.message}`);
            }

            if(data.reaction === "like")
            {
                likeDelta = -1;
                dislikeDelta = 0;
            }
            else if(data.reaction === "dislike")
            {
                likeDelta = 0;
                dislikeDelta = -1;
            }

            return {id: data.post_id, likeDelta: likeDelta, dislikeDelta: dislikeDelta};
        }
        else
        {
            const { data, error: updateError } = await supabase
                .from("post_reactions")
                .update({ reaction: reactionType })
                .eq("user_id", user.id)
                .eq("post_id", postId)
                .select("post_id, reaction")
                .single()

            if(updateError)
            {
                throw new Error(`Database UPDATE error: ${updateError.message}`);
            }

            if(existingReaction.reaction === "like" && data.reaction === "dislike")
            {
                likeDelta = -1;
                dislikeDelta = 1;
            }
            else if(existingReaction.reaction === "dislike" && data.reaction === "like")
            {
                likeDelta = 1;
                dislikeDelta = -1
            }

            return {id: data.post_id, likeDelta: likeDelta, dislikeDelta: dislikeDelta};
        }

    } catch (error) {
        throw new Error(`Failed to apply reaction: ${error.message}`);
    }
}


async function getSpecificPost(postId) {
    try {
        const user = await getAuthUserData();
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
                    display_name,
                    avatar_path
                ),

                post_reactions (
                    user_id,
                    reaction
                ),

                comments (
                    id,
                    post_id,
                    user_id,
                    content,
                    created_at,

                    profiles!comments_user_id_fkey (
                        username,
                        display_name,
                        avatar_path
                    ),

                    comment_reactions (
                        user_id,
                        reaction
                    )
                )
            `)
            .eq("id", postId)
            .single();

        if (error) {
            throw new Error(`Database SELECT error: ${error.message}`);
        }

        // STEP 1: Separate the post's nested data
        const {
            profiles,
            post_reactions,
            comments,
            ...postData
        } = data;

        // STEP 2: Count reactions on the post itself
        const postReactions = post_reactions ?? [];

        const likeCount = postReactions.filter(
            reaction => reaction.reaction === "like"
        ).length;

        const dislikeCount = postReactions.filter(
            reaction => reaction.reaction === "dislike"
        ).length;

        // STEP 3: Normalize each individual comment
        const normalizedComments = (comments ?? []).map(comment => {
            const {
                profiles: commentProfile,
                comment_reactions,
                ...commentData
            } = comment;

            const reactions = comment_reactions ?? [];

            const commentLikeCount = reactions.filter(
                reaction => reaction.reaction === "like"
            ).length;

            const commentDislikeCount = reactions.filter(
                reaction => reaction.reaction === "dislike"
            ).length;

            return {
                ...commentData,
                username: commentProfile?.username ?? null,
                display_name: commentProfile?.display_name ?? null,
                avatar_path: commentProfile?.avatar_path ?? null,
                likeCount: commentLikeCount,
                dislikeCount: commentDislikeCount,
                isOwner: comment.user_id === user?.id
            };
        });

        // STEP 4: Return one organized post object
        return {
            ...postData,
            username: profiles?.username ?? null,
            display_name: profiles?.display_name ?? null,
            avatar_path: profiles?.avatar_path ?? null,
            likeCount,
            dislikeCount,
            comments: normalizedComments.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            )
        };

    } catch (error) {
        throw new Error(`Failed to retrieve post: ${error.message}`);
    }
}


async function addComment(postId, content) {
    try {
        const user = await getAuthUserData();

        const { data, error: insertError } = await supabase
            .from("comments")
            .insert({
                post_id: postId,
                user_id: user.id,
                content: content
            })
            .select(`
                id,
                user_id,
                post_id,
                content,
                created_at,
                profiles!comments_user_id_fkey (
                    username,
                    display_name,
                    avatar_path
                )
            `)
            .single();

        if (insertError) {
            throw new Error(`Database INSERT error: ${insertError.message}`);
        }

        const { profiles, ...commentData } = data;

        return {
            ...commentData,
            username: profiles?.username ?? null,
            display_name: profiles?.display_name ?? null,
            avatar_path: profiles?.avatar_path ?? null,
            likeCount: 0,
            dislikeCount: 0,
            isOwner: true
        };

    } catch (error) {
        throw new Error(`Failed to add comment to current post: ${error.message}`);
    }
}


async function updateComment(commentId, content) {
    try {
        const user = await getAuthUserData();

        const { data, error: updateError } = await supabase
            .from("comments")
            .update({
                content: content
            })
            .eq("id", commentId)
            .eq("user_id", user.id)
            .select("id, content")
            .maybeSingle();

        if (updateError) {
            throw new Error(`Database UPDATE error: ${updateError.message}`);
        }

        if (!data) {
            throw new Error("Comment not found or you cannot edit it.");
        }

        return data;

    } catch (error) {
        throw new Error(`Failed to update current comment: ${error.message}`);
    }
}


async function deleteComment(commentId) 
{
    try {
        const user = await getAuthUserData();

        const { data, error: deleteError } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

        if(deleteError)
        {
            throw new Error(`Database DELETE error: ${deleteError.message}`);
        }

        if(!data)
        {
            throw new Error(`Comment not found or you cannot delete it.`);
        }

        return data;
    } catch (error) {
        throw new Error(`Failed to delete comment: ${error.message}`);
    }    
}


async function applyCommentReaction(commentId, reactionType)
{
    try {
        const user = await getAuthUserData();

        const { data: existingComment, error: commentError } = await supabase
            .from("comments")
            .select("id")
            .eq("id", commentId)
            .maybeSingle();

        if(commentError)
        {
            throw new Error(`Database SELECT error: ${commentError.message}`);
        }

        if(!existingComment)
        {
            throw new Error(`Comment not found`);
        }

        const { data: existingReaction, error: reactionError } = await supabase
            .from("comment_reactions")
            .select("reaction")
            .eq("comment_id", commentId)
            .eq("user_id", user.id)
            .maybeSingle();

        if(reactionError)
        {
            throw new Error(`Failed to retrieve comment reaction: ${reactionError.message}`);
        }

        let likeDelta;
        let dislikeDelta;

        if(!existingReaction)
        {
            const { data, error: insertError } = await supabase
                .from("comment_reactions")
                .insert({
                    comment_id: commentId,
                    user_id: user.id,
                    reaction: reactionType
                })
                .select("comment_id, reaction")
                .single()

            if(insertError)
            {
                throw new Error(`Database INSERT error: ${insertError.message}`);
            }

            if(data.reaction === "like")
            {
                likeDelta = 1;
                dislikeDelta = 0;
            }
            else if(data.reaction === "dislike")
            {
                likeDelta = 0;
                dislikeDelta = 1;
            }

            return {id: data.comment_id, likeDelta: likeDelta, dislikeDelta: dislikeDelta };
        }
        else if(existingReaction.reaction === reactionType)
        {
            const { data, error: deleteError } = await supabase
                .from("comment_reactions")
                .delete()
                .eq("comment_id", commentId)
                .eq("user_id", user.id)
                .select("comment_id, reaction")
                .single()

            if(deleteError)
            {
                throw new Error(`Database DELETE error: ${deleteError.message}`);
            }

            if(data.reaction === "like")
            {
                likeDelta = -1;
                dislikeDelta = 0;
            }
            else if(data.reaction === "dislike")
            {
                likeDelta = 0;
                dislikeDelta = -1;
            }

            return {id: data.comment_id, likeDelta: likeDelta, dislikeDelta: dislikeDelta };
        }
        else
        {
            const { data, error: updateError } = await supabase
                .from("comment_reactions")
                .update({ reaction: reactionType })
                .eq("comment_id", commentId)
                .eq("user_id", user.id)
                .select("comment_id, reaction")
                .single();

            if(updateError)
            {
                throw new Error(`Database UPDATE error: ${updateError.message}`);
            }

            if(existingReaction.reaction === "like" && data.reaction === "dislike")
            {
                likeDelta = -1;
                dislikeDelta = 1;
            }
            else if(existingReaction.reaction === "dislike" && data.reaction === "like")
            {
                likeDelta = 1;
                dislikeDelta = -1;
            }

            return {id: data.comment_id, likeDelta: likeDelta, dislikeDelta: dislikeDelta };
        }
    } catch (error) {
        throw new Error(`Failed to update comment reaction: ${error.message}`);
    }
}

async function getMyProfile()
{
    try
    {
        const user = await getAuthUserData();

        const { data, error: fetchError } = await supabase
            .from("profiles")
            .select("id, username, display_name, bio, avatar_path")
            .eq("id", user.id)
            .single();

        if(fetchError)
        {
            throw new Error(`Database SELECT error: ${fetchError.message}`);
        }

        return data;
    }
    catch(error)
    {
        throw new Error(`Failed to retrieve user profile: ${error.message}`);
    }
}

async function getProfile(userId = null) 
{
    try {
        if(userId == null)
        {
            const user = await getAuthUserData();
            userId = user.id;
        }
        const { data, error } = await supabase
            .from("profiles")
            .select("id, username, display_name, bio, avatar_path")
            .eq("id", userId)
            .maybeSingle();

        if(error)
        {
            throw new Error(`Database SELECT error: ${error.message}`);
        }

        return data;
    } catch (error) {
        throw new Error(`Failed to get ${userId}'s profile: ${error.message}`);
    }
}

async function updateProfile({displayName, bio, newAvatar, oldImagePath, removeAvatar})
{
    try {
        const user = await getAuthUserData();

        const updates = {};
        let newImagePath = undefined;

        // 1. Upload the new avatar first
        if (newAvatar)
        {
            newImagePath = await uploadAvatar(newAvatar);
            updates.avatar_path = newImagePath;
        }

        if (displayName !== undefined)
        {
            updates.display_name = displayName;
        }

        if (bio !== undefined)
        {
            updates.bio = bio;
        }

        if(removeAvatar)
        {
            updates.avatar_path = null;
        }

        if (Object.keys(updates).length === 0)
        {
            throw new Error("No profile changes provided.");
        }

        // 2. Update the database
        let data;

        try {
            const { data: updatedProfile, error: updateError } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", user.id)
                .select("id, display_name, bio, avatar_path")
                .single();

            if (updateError)
            {
                throw new Error(`Database UPDATE error: ${updateError.message}`);
            }

            data = updatedProfile;

        } catch (updateError) {

            // Database failed: delete newly uploaded avatar
            if (newImagePath)
            {
                try {
                    await deleteAvatar(newImagePath);
                } catch (cleanupError) {
                    console.error(
                        "Failed to clean up newly uploaded avatar:",
                        cleanupError
                    );
                }
            }

            throw updateError;
        }

        // 3. Database succeeded: delete old avatar
        if ((newImagePath || removeAvatar) && oldImagePath)
        {
            try {
                await deleteAvatar(oldImagePath);
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up old uploaded avatar:",
                    cleanupError
                );
            }
        }

        return data;

    } catch (error) {
        throw new Error(`Failed to update user profile: ${error.message}`);
    }
}


export { createPost, 
    getAllUserPosts, 
    updatePost, 
    deletePost, 
    getAllPosts, 
    applyReaction, 
    getSpecificPost, 
    addComment, 
    updateComment, 
    deleteComment, 
    applyCommentReaction,
    uploadPostImage,
    getPostImageUrl,
    deletePostImage,
    getMyProfile, 
    getAvatarImageUrl,
    uploadAvatar,
    deleteAvatar,
    updateProfile, 
    getProfile 
};