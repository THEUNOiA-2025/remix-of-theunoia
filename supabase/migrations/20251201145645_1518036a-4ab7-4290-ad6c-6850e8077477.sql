CREATE TABLE public.colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.student_verifications 
ADD COLUMN college_id UUID REFERENCES public.colleges(id);

ALTER TABLE public.student_verifications 
ALTER COLUMN institute_name DROP NOT NULL;

ALTER TABLE public.user_projects 
ADD COLUMN is_community_task BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_projects 
ADD COLUMN community_college_id UUID REFERENCES public.colleges(id);