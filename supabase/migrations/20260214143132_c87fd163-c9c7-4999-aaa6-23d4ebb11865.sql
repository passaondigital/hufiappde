
-- Create ecosystem_links table
CREATE TABLE public.ecosystem_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_key text NOT NULL,
  external_id text,
  status text DEFAULT 'not_connected',
  data_sharing_enabled boolean DEFAULT false,
  connected_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, app_key)
);

-- Enable RLS
ALTER TABLE public.ecosystem_links ENABLE ROW LEVEL SECURITY;

-- Users can CRUD own links
CREATE POLICY "Users can CRUD own ecosystem links"
ON public.ecosystem_links
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all ecosystem links"
ON public.ecosystem_links
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ecosystem_links_updated_at
BEFORE UPDATE ON public.ecosystem_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
