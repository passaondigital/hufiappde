-- Storage bucket for user chat backgrounds
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-backgrounds', 'chat-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own background
CREATE POLICY "Users can upload their own chat background"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own background
CREATE POLICY "Users can update their own chat background"
ON storage.objects FOR UPDATE
USING (bucket_id = 'chat-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own background
CREATE POLICY "Users can delete their own chat background"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read access for chat backgrounds
CREATE POLICY "Chat backgrounds are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-backgrounds');

-- Add chat_bg_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_bg_url TEXT;
