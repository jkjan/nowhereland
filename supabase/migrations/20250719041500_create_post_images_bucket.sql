-- Create post-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for post-images bucket
CREATE POLICY "Admin can upload post images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND (auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "Anyone can view post images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'post-images');

CREATE POLICY "Admin can update post images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'post-images' AND (auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "Admin can delete post images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'post-images' AND (auth.jwt() ->> 'is_admin')::boolean = true);