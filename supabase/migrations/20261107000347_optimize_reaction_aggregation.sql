
-- Calculate likes and dislikes for each post.
CREATE OR REPLACE FUNCTION public.get_reaction_counts()
RETURNS TABLE (
    post_id UUID,
    like_count BIGINT,
    dislike_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        post_id,
        COUNT(*) FILTER (WHERE reaction = 'like') AS like_count,
        COUNT(*) FILTER (WHERE reaction = 'dislike') AS dislike_count
    FROM public.post_reactions
    GROUP BY post_id;
$$;

-- Expose posts with pre-aggregated reaction counts.
CREATE OR REPLACE VIEW public.posts_with_reaction_counts
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.user_id,
    p.title,
    p.content,
    p.image_path,
    p.created_at,
    COALESCE(r.like_count, 0) AS like_count,
    COALESCE(r.dislike_count, 0) AS dislike_count,
    pr.username,
    pr.display_name,
    pr.avatar_path,
    COALESCE(c.comment_count, 0) AS comment_count
FROM public.posts AS p
LEFT JOIN public.get_reaction_counts() AS r
    ON r.post_id = p.id
LEFT JOIN public.profiles AS pr
    ON pr.id = p.user_id
LEFT JOIN (
    SELECT post_id, COUNT(*) AS comment_count
    FROM public.comments
    GROUP BY post_id
) AS c
    ON c.post_id = p.id;
