-- Create admin user directly if not exists
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@zando.cg';
  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated',
      'admin@zando.cg', crypt('admin2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Administrateur ZANDO","phone":"","city":"Pointe-Noire"}'::jsonb,
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_uid, jsonb_build_object('sub', admin_uid::text, 'email', 'admin@zando.cg'), 'email', admin_uid::text, now(), now(), now());
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, email, name, phone, city)
  VALUES (admin_uid, 'admin@zando.cg', 'Administrateur ZANDO', '', 'Pointe-Noire')
  ON CONFLICT (id) DO NOTHING;

  -- Ensure admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_uid, 'admin')
  ON CONFLICT DO NOTHING;
END $$;

-- Ensure trigger on auth.users exists for future signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();