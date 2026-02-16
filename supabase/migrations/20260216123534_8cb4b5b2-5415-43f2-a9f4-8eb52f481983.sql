
-- Token & Storage balance tracking
CREATE TABLE public.user_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  ai_tokens_remaining INT NOT NULL DEFAULT 0,
  storage_extra_gb INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own balance"
  ON public.user_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage balances"
  ON public.user_balances FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for auto-create balance on new user
CREATE OR REPLACE FUNCTION public.handle_new_user_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_balances (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_balance();

-- Purchase history
CREATE TABLE public.addon_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  addon_type TEXT NOT NULL, -- 'tokens' or 'storage'
  addon_key TEXT NOT NULL,
  amount INT NOT NULL,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.addon_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
  ON public.addon_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Updated_at trigger for balances
CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON public.user_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
