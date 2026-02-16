
-- DB functions for atomic balance crediting
CREATE OR REPLACE FUNCTION public.credit_tokens(p_user_id UUID, p_amount INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE user_balances
  SET ai_tokens_remaining = ai_tokens_remaining + p_amount
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_storage(p_user_id UUID, p_amount INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE user_balances
  SET storage_extra_gb = storage_extra_gb + p_amount
  WHERE user_id = p_user_id;
END;
$$;
