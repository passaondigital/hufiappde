
-- 1. User Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admins can see all roles, users can see their own
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 2. User Subscriptions / Plans
CREATE TYPE public.subscription_plan AS ENUM ('free', 'premium');

CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  ai_requests_today int NOT NULL DEFAULT 0,
  ai_requests_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan) VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. AI Usage Log (for cost tracking / analytics)
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tokens_in int NOT NULL DEFAULT 0,
  tokens_out int NOT NULL DEFAULT 0,
  model text NOT NULL DEFAULT 'gemini-3-flash-preview',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.ai_usage_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage" ON public.ai_usage_log
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin-only view: all profiles (for admin dashboard)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only policies for managing all data
CREATE POLICY "Admins can view all horses" ON public.horses
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all notes" ON public.notes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all appointments" ON public.appointments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all customers" ON public.customers
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all chat_messages" ON public.chat_messages
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Function to check and increment AI usage (called from edge function)
CREATE OR REPLACE FUNCTION public.check_ai_limit(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub user_subscriptions%ROWTYPE;
  v_limit int;
BEGIN
  SELECT * INTO v_sub FROM user_subscriptions WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'Kein Abonnement gefunden');
  END IF;

  IF NOT v_sub.is_active THEN
    RETURN json_build_object('allowed', false, 'reason', 'Konto deaktiviert');
  END IF;

  -- Reset daily counter if new day
  IF v_sub.ai_requests_reset_date < CURRENT_DATE THEN
    UPDATE user_subscriptions SET ai_requests_today = 0, ai_requests_reset_date = CURRENT_DATE WHERE user_id = p_user_id;
    v_sub.ai_requests_today := 0;
  END IF;

  -- Set limit based on plan
  v_limit := CASE v_sub.plan WHEN 'free' THEN 10 WHEN 'premium' THEN 100 ELSE 10 END;

  IF v_sub.ai_requests_today >= v_limit THEN
    RETURN json_build_object('allowed', false, 'reason', format('Tägliches Limit erreicht (%s/%s)', v_sub.ai_requests_today, v_limit), 'plan', v_sub.plan);
  END IF;

  -- Increment
  UPDATE user_subscriptions SET ai_requests_today = ai_requests_today + 1 WHERE user_id = p_user_id;

  RETURN json_build_object('allowed', true, 'remaining', v_limit - v_sub.ai_requests_today - 1, 'plan', v_sub.plan);
END;
$$;
