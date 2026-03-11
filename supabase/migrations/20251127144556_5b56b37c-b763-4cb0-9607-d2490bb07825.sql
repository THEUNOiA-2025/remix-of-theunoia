-- Allow users to view profiles of people they have conversations with
CREATE POLICY "Users can view profiles of conversation participants"
ON public.user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE (conversations.client_id = auth.uid() AND conversations.freelancer_id = user_profiles.user_id)
       OR (conversations.freelancer_id = auth.uid() AND conversations.client_id = user_profiles.user_id)
  )
);