SET local check_function_bodies = off;

ALTER TABLE "public"."profiles"
  DROP CONSTRAINT "profiles_username_check";

CREATE TABLE "public"."comment_reactions" (
  "user_id"    uuid                     NOT NULL,
  "comment_id" uuid                     NOT NULL,
  "reaction"   public.reaction_type     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "comment_reactions_pkey" PRIMARY KEY (user_id, comment_id)
);

ALTER TABLE "public"."comment_reactions"
  ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE "public"."comment_reactions"
  ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE "public"."comment_reactions"
  ADD CONSTRAINT "comment_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_username_check" CHECK ((((length((username)::text) >= 3) AND (length((username)::text) <= 30)) AND ((username)::text ~ '^[A-Za-z0-9_]+$'::text)));

CREATE POLICY "Everyone can read comment reactions" ON "public"."comment_reactions"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Users can delete their own reaction to comments" ON "public"."comment_reactions"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can react to comments" ON "public"."comment_reactions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can update their own reaction to comments" ON "public"."comment_reactions"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

REVOKE ALL ON TABLE "public"."comment_reactions" FROM "anon";

GRANT SELECT ON TABLE "public"."comment_reactions" TO "anon";

REVOKE ALL ON TABLE "public"."comment_reactions" FROM "authenticated";

REVOKE ALL ("reaction") ON TABLE "public"."comment_reactions" FROM "authenticated";

GRANT UPDATE ("reaction") ON TABLE "public"."comment_reactions" TO "authenticated";

GRANT DELETE, INSERT, SELECT ON TABLE "public"."comment_reactions" TO "authenticated";

REVOKE ALL ON TABLE "public"."comment_reactions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comment_reactions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comment_reactions" TO "service_role";

