BEGIN;

-- Remove broad table permissions from client roles.
REVOKE ALL ON TABLE public.profiles
FROM anon, authenticated;

-- Everyone can read public profiles.
GRANT SELECT ON TABLE public.profiles
TO anon, authenticated;

-- Signed-in users can create their profiles.
GRANT INSERT ON TABLE public.profiles
TO authenticated;

-- Signed-in users can edit only these fields.
GRANT UPDATE (
    display_name,
    bio,
    avatar_path
)
ON TABLE public.profiles
TO authenticated;

COMMIT;
