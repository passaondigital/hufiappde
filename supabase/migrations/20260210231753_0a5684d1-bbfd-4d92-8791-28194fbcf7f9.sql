
-- HuufiConnect: Connections between users
CREATE TABLE public.user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON public.user_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create connection requests" ON public.user_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update connections they received" ON public.user_connections FOR UPDATE
  USING (auth.uid() = receiver_id);
CREATE POLICY "Users can delete own connections" ON public.user_connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Shared horses: what horses a user shares with connections
CREATE TABLE public.shared_horses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  horse_id uuid NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
  shared_with_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(horse_id, shared_with_id)
);

ALTER TABLE public.shared_horses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage shared horses" ON public.shared_horses FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Shared users can view" ON public.shared_horses FOR SELECT
  USING (auth.uid() = shared_with_id);

-- Connect code for each user (short code for QR/sharing)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connect_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS webauthn_credential_id text;

-- Generate connect codes for existing users
UPDATE public.profiles SET connect_code = UPPER(SUBSTR(MD5(user_id::text || 'connect'), 1, 8)) WHERE connect_code IS NULL;
UPDATE public.profiles SET referral_code = UPPER(SUBSTR(MD5(user_id::text || 'refer'), 1, 6)) WHERE referral_code IS NULL;

-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subs" ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to auto-generate connect/referral codes on new profile
CREATE OR REPLACE FUNCTION public.generate_user_codes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.connect_code IS NULL THEN
    NEW.connect_code := UPPER(SUBSTR(MD5(NEW.user_id::text || 'connect' || NOW()::text), 1, 8));
  END IF;
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTR(MD5(NEW.user_id::text || 'refer' || NOW()::text), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_codes_on_profile BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION generate_user_codes();
