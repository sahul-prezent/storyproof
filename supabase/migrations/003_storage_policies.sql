-- Allow authenticated users to upload files to the temp/ folder in the uploads bucket
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'temp');

-- Allow authenticated users to read their uploaded files
CREATE POLICY "Allow authenticated reads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'temp');

-- Allow service role to delete temp files after scoring
CREATE POLICY "Allow service role deletes"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'uploads');
