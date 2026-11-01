SET local check_function_bodies = off;

ALTER TABLE "public"."profiles"
  DROP CONSTRAINT "profiles_username_check";

CREATE TABLE "public"."post_reactions" (
  "user_id" uuid NOT NULL,
  "post_id" uuid NOT NULL,
  CONSTRAINT "post_reactions_pkey" PRIMARY KEY (user_id, post_id)
);

ALTER TABLE "public"."post_reactions"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."reaction_type" AS ENUM (
  'like',
  'dislike'
);

ALTER TABLE "public"."post_reactions"
  ADD COLUMN "reaction" public.reaction_type NOT NULL;

ALTER TABLE "public"."post_reactions"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.prevent_username_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
BEGIN
    IF NEW.username IS DISTINCT FROM OLD.username THEN
        RAISE EXCEPTION 'Username cannot be changed';
    END IF;

    RETURN NEW;
END;
$function$;

ALTER TABLE "public"."post_reactions"
  ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE "public"."post_reactions"
  ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_username_check" CHECK ((((length((username)::text) >= 3) AND (length((username)::text) <= 30)) AND ((username)::text ~ '^[A-Za-z0-9_]+$'::text)));

CREATE POLICY "Everyone can read reactions" ON "public"."post_reactions"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Users can delete own reaction" ON "public"."post_reactions"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can react to posts" ON "public"."post_reactions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can update own reaction" ON "public"."post_reactions"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

REVOKE ALL ON TABLE "public"."post_reactions" FROM "anon";

GRANT SELECT ON TABLE "public"."post_reactions" TO "anon";

REVOKE ALL ON TABLE "public"."post_reactions" FROM "authenticated";

REVOKE ALL ("reaction") ON TABLE "public"."post_reactions" FROM "authenticated";

GRANT UPDATE ("reaction") ON TABLE "public"."post_reactions" TO "authenticated";

GRANT DELETE, INSERT, SELECT ON TABLE "public"."post_reactions" TO "authenticated";

REVOKE ALL ON TABLE "public"."post_reactions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."post_reactions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."post_reactions" TO "service_role";

