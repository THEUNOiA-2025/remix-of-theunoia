-- Add attachments column to messages table for file/image sharing
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN public.messages.attachments IS 'Array of attachment objects: [{name: string, url: string, type: string, size: number}]';

-- Create storage bucket for message attachments if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for message attachments bucket
CREATE POLICY "Users can upload message attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view message attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'message-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'message-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);