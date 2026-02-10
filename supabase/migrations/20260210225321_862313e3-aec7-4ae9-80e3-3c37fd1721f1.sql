
-- Storage bucket for horse/note images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- RLS policies for images bucket
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'images');

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add image_url column to horses table
ALTER TABLE public.horses ADD COLUMN image_url text;

-- Add category column to notes for smart categorization
ALTER TABLE public.notes ADD COLUMN category text DEFAULT 'allgemein';

-- Add location columns to horses for regional stats
ALTER TABLE public.profiles ADD COLUMN location_lat double precision;
ALTER TABLE public.profiles ADD COLUMN location_lng double precision;
ALTER TABLE public.profiles ADD COLUMN location_name text;
