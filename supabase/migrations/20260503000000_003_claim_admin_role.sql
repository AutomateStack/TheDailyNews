-- Function callable from the client to claim admin role when none exists.
-- Returns { success: true } or { success: false, error: "..." }.
CREATE OR REPLACE FUNCTION public.claim_admin_role()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';

  IF admin_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'An admin already exists.');
  END IF;

  -- Update if profile row exists
  UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();

  -- Insert if no profile row yet (trigger may not have run)
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (auth.uid(), '', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin_role() TO authenticated;
