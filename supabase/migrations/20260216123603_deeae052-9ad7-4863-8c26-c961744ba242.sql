
-- Fix overly permissive RLS: drop the "service role" policy (service role bypasses RLS anyway)
DROP POLICY "Service role can manage balances" ON public.user_balances;

-- Add proper insert policy for users
CREATE POLICY "Users can insert own balance"
  ON public.user_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add proper update policy for users (limited to own row)
CREATE POLICY "Users can update own balance"
  ON public.user_balances FOR UPDATE
  USING (auth.uid() = user_id);
