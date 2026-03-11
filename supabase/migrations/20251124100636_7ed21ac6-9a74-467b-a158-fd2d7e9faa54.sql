-- Allow users to update last_message_at in their conversations
CREATE POLICY "Users can update their conversation timestamps"
ON public.conversations
FOR UPDATE
USING ((auth.uid() = client_id) OR (auth.uid() = freelancer_id))
WITH CHECK ((auth.uid() = client_id) OR (auth.uid() = freelancer_id));

-- Function to create conversation when bid is accepted
CREATE OR REPLACE FUNCTION public.create_conversation_on_bid_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  -- Only proceed if bid status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get the project owner (client) from user_projects
    SELECT user_id INTO project_owner_id
    FROM user_projects
    WHERE id = NEW.project_id;
    
    -- Check if conversation already exists for this project and these users
    IF NOT EXISTS (
      SELECT 1 FROM conversations
      WHERE project_id = NEW.project_id
      AND client_id = project_owner_id
      AND freelancer_id = NEW.freelancer_id
    ) THEN
      -- Create the conversation
      INSERT INTO conversations (
        project_id,
        client_id,
        freelancer_id,
        last_message_at
      ) VALUES (
        NEW.project_id,
        project_owner_id,
        NEW.freelancer_id,
        NOW()
      );
      
      -- Insert a system message to start the conversation
      INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        is_read
      ) VALUES (
        (SELECT id FROM conversations 
         WHERE project_id = NEW.project_id 
         AND client_id = project_owner_id 
         AND freelancer_id = NEW.freelancer_id
         LIMIT 1),
        project_owner_id,
        'Bid accepted! You can now discuss project details.',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for bid acceptance
DROP TRIGGER IF EXISTS on_bid_accepted ON public.bids;
CREATE TRIGGER on_bid_accepted
  AFTER UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.create_conversation_on_bid_accepted();