
-- User feedback table for MVP validation
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'feedback',
  -- Categories: nutzen, verstaendnis, problem, wunsch, feedback
  subcategory TEXT,
  -- e.g. "problem_melden", "idee", "frage"
  content TEXT NOT NULL,
  rating INTEGER,
  -- 1-5 scale for contextual questions
  priority TEXT DEFAULT 'normal',
  -- low, normal, high
  status TEXT NOT NULL DEFAULT 'offen',
  -- offen, geprueft, erledigt
  context TEXT,
  -- e.g. "after_3_days", "after_first_chat", "after_7_days", "manual"
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own feedback"
ON public.user_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
ON public.user_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback"
ON public.user_feedback FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- MVP contextual questions tracking (which questions user has answered)
CREATE TABLE public.mvp_question_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_key TEXT NOT NULL,
  -- e.g. "after_3_days", "after_first_chat", "after_7_days"
  response_rating INTEGER,
  response_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_key)
);

ALTER TABLE public.mvp_question_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own responses"
ON public.mvp_question_responses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses"
ON public.mvp_question_responses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add role field to profiles for MVP tracking (Besitzer/Profi)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'besitzer';
