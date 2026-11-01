SET local check_function_bodies = off;

ALTER TABLE "public"."profiles"
  DROP CONSTRAINT "profiles_username_check";

CREATE TABLE "public"."comments" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "post_id"    uuid                     NOT NULL,
  "content"    text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "comments_content_not_blank" CHECK ((length(btrim(content)) > 0)),
  CONSTRAINT "comments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."comments"
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

ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_username_check" CHECK ((((length((username)::text) >= 3) AND (length((username)::text) <= 30)) AND ((username)::text ~ '^[A-Za-z0-9_]+$'::text)));

CREATE POLICY "Everyone can read comments" ON "public"."comments"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Users create own comments" ON "public"."comments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users delete own comments" ON "public"."comments"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users update own comments" ON "public"."comments"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

REVOKE ALL ON TABLE "public"."comments" FROM "anon";

GRANT SELECT ON TABLE "public"."comments" TO "anon";

REVOKE ALL ON TABLE "public"."comments" FROM "authenticated";

REVOKE ALL ("content") ON TABLE "public"."comments" FROM "authenticated";

GRANT UPDATE ("content") ON TABLE "public"."comments" TO "authenticated";

GRANT DELETE, INSERT, SELECT ON TABLE "public"."comments" TO "authenticated";

REVOKE ALL ON TABLE "public"."comments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comments" TO "service_role";

