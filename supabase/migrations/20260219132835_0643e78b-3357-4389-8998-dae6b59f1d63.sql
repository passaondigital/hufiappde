-- Fix: app_features RLS policy should only expose active features to public
DROP POLICY IF EXISTS "Anyone can view active features" ON public.app_features;

CREATE POLICY "Anyone can view active features"
ON public.app_features FOR SELECT
USING (is_active = true);