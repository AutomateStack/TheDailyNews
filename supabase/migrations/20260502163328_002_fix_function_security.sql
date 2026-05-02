/*
  # Fix Security Issues in Database Functions

  1. Search Path Mutability
    - Set `search_path = ''` on all three functions (`generate_slug`, `update_updated_at`, `handle_new_user`)
    - This prevents search_path manipulation attacks by locking the function's search path

  2. SECURITY DEFINER Execution on `handle_new_user`
    - Revoke EXECUTE from `anon` and `authenticated` roles on `handle_new_user`
    - This function is only meant to be called by the database trigger on auth.users INSERT,
      not directly via the REST API. Revoking public execution prevents abuse.

  3. Important Notes
    1. The trigger on `auth.users` still works because it executes as the function owner (postgres),
       which is unaffected by REVOKE on anon/authenticated.
    2. `generate_slug` and `update_updated_at` are regular (SECURITY INVOKER) functions, so
       they only need the search_path fix.
*/

-- Fix search_path on all three functions
CREATE OR REPLACE FUNCTION public.generate_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.slug = gen_random_uuid()::text OR NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    WHILE EXISTS (SELECT 1 FROM public.articles WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug := NEW.slug || '-' || floor(random() * 1000)::text;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'reader');
  RETURN NEW;
END;
$$;

-- Revoke direct execution of handle_new_user from anon and authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
