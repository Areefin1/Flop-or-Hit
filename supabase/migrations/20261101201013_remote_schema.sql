SET local check_function_bodies = off;

ALTER TABLE "public"."profiles"
  DROP CONSTRAINT "profiles_username_check";

CREATE TABLE "public"."posts" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "title"      character varying(100)   NOT NULL,
  "content"    text,
  "image_path" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "posts_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."posts"
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

ALTER TABLE "public"."posts"
  ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_username_check" CHECK ((((length((username)::text) >= 3) AND (length((username)::text) <= 30)) AND ((username)::text ~ '^[A-Za-z0-9_]+$'::text)));

CREATE POLICY "Public can read posts" ON "public"."posts"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Users create own posts" ON "public"."posts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users delete own posts" ON "public"."posts"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users update own posts" ON "public"."posts"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

REVOKE ALL ON TABLE "public"."posts" FROM "anon";

GRANT SELECT ON TABLE "public"."posts" TO "anon";

REVOKE ALL ON TABLE "public"."posts" FROM "authenticated";

REVOKE ALL ("content") ON TABLE "public"."posts" FROM "authenticated";

GRANT UPDATE ("content") ON TABLE "public"."posts" TO "authenticated";

REVOKE ALL ("image_path") ON TABLE "public"."posts" FROM "authenticated";

GRANT UPDATE ("image_path") ON TABLE "public"."posts" TO "authenticated";

REVOKE ALL ("title") ON TABLE "public"."posts" FROM "authenticated";

GRANT UPDATE ("title") ON TABLE "public"."posts" TO "authenticated";

GRANT DELETE, INSERT, SELECT ON TABLE "public"."posts" TO "authenticated";

REVOKE ALL ON TABLE "public"."posts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "service_role";

