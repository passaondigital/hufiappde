
-- Documents vault table
CREATE TABLE public.vault_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint DEFAULT 0,
  category text DEFAULT 'allgemein',
  horse_id uuid REFERENCES public.horses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own vault docs" ON public.vault_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all vault docs" ON public.vault_documents FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_vault_documents_updated_at BEFORE UPDATE ON public.vault_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vault password hash stored on profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vault_password_hash text;

-- Onboarding flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- LLM provider configs (admin only)
CREATE TABLE public.llm_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL, -- 'openai', 'anthropic', 'google', etc.
  api_key_secret_name text NOT NULL, -- reference to secret name
  model_name text NOT NULL,
  is_active boolean DEFAULT false,
  cost_per_1m_input numeric DEFAULT 0,
  cost_per_1m_output numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.llm_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage LLM providers" ON public.llm_providers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_llm_providers_updated_at BEFORE UPDATE ON public.llm_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for vault documents
INSERT INTO storage.buckets (id, name, public) VALUES ('vault', 'vault', false) ON CONFLICT DO NOTHING;

-- Storage policies for vault bucket
CREATE POLICY "Users can upload own vault files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own vault files" ON storage.objects FOR SELECT USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own vault files" ON storage.objects FOR DELETE USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);
