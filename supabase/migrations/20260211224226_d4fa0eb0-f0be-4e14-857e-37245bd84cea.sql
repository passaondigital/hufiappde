
-- Projects Master table
CREATE TABLE public.projects_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aktiv',
  assets_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_logic_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own projects" ON public.projects_master FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all projects" ON public.projects_master FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User Learning Profile table
CREATE TABLE public.user_learning_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  favorite_topics TEXT[] DEFAULT '{}',
  input_count INTEGER NOT NULL DEFAULT 0,
  last_input_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_learning_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own learning profile" ON public.user_learning_profile FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.user_learning_profile FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_projects_master_updated_at
  BEFORE UPDATE ON public.projects_master
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_learning_profile_updated_at
  BEFORE UPDATE ON public.user_learning_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
