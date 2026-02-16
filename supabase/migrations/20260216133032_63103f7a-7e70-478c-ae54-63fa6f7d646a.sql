
CREATE TABLE public.motion_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  horse_name TEXT,
  owner_name TEXT,
  symmetry_score INTEGER NOT NULL,
  lameness_index NUMERIC(3,1) NOT NULL,
  beat_clarity INTEGER NOT NULL,
  symmetry_desc TEXT,
  lameness_desc TEXT,
  beat_desc TEXT,
  ai_note TEXT,
  frame_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.motion_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
ON public.motion_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
ON public.motion_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
ON public.motion_analyses FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analyses"
ON public.motion_analyses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
