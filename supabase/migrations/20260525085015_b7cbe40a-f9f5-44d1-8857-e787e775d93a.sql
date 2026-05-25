CREATE POLICY "Authenticated users can view available numbers"
ON public.phone_numbers FOR SELECT
TO authenticated
USING (status = 'available' AND user_id IS NULL);