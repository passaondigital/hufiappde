
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Knowledge vault table for transcripts, ideas, strategies
CREATE TABLE public.knowledge_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'transcript',
  source text NOT NULL DEFAULT 'voice',
  metadata jsonb DEFAULT '{}',
  embedding extensions.vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own knowledge" ON public.knowledge_vault FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all knowledge" ON public.knowledge_vault FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_knowledge_vault_updated_at
  BEFORE UPDATE ON public.knowledge_vault
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Medical logs for hoof measurements, findings
CREATE TABLE public.medical_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  horse_id uuid REFERENCES public.horses(id) ON DELETE CASCADE,
  log_type text NOT NULL DEFAULT 'befund',
  title text NOT NULL DEFAULT '',
  measurements jsonb DEFAULT '{}',
  findings text,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own medical logs" ON public.medical_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all medical logs" ON public.medical_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_medical_logs_updated_at
  BEFORE UPDATE ON public.medical_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Business strategies (admin-only write, own-read for all)
CREATE TABLE public.business_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'idee',
  priority text DEFAULT 'normal',
  status text DEFAULT 'offen',
  source text NOT NULL DEFAULT 'voice',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all strategies" ON public.business_strategies FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_business_strategies_updated_at
  BEFORE UPDATE ON public.business_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Voice usage tracking for future Stripe billing
CREATE TABLE public.voice_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  agent_id text,
  transcript text,
  routing_result text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice usage" ON public.voice_usage_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice usage" ON public.voice_usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all voice usage" ON public.voice_usage_log FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
