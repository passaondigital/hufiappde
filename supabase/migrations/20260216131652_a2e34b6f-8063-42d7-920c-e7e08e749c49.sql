-- Add endpoint URL and remove the 3-provider limit
ALTER TABLE public.llm_providers
ADD COLUMN IF NOT EXISTS api_endpoint TEXT DEFAULT 'https://api.openai.com/v1/chat/completions',
ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

-- Allow admins to manage LLM providers
-- (policies already exist, just ensure they're correct)
