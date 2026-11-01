SET local check_function_bodies = off;

ALTER TABLE "public"."profiles"
  DROP CONSTRAINT "profiles_username_check";

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

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_username_check" CHECK ((((length((username)::text) >= 3) AND (length((username)::text) <= 30)) AND ((username)::text ~ '^[A-Za-z0-9_]+$'::text)));

