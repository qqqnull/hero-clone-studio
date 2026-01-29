-- Create storage bucket for site assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true);

-- Create policy for public access to site assets
CREATE POLICY "Public can view site assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-assets');

-- Create policy for authenticated users to upload site assets
CREATE POLICY "Authenticated users can upload site assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to update site assets
CREATE POLICY "Authenticated users can update site assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to delete site assets
CREATE POLICY "Authenticated users can delete site assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');