-- Create user_todos table
CREATE TABLE IF NOT EXISTS public.user_todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_weekly_plans table
CREATE TABLE IF NOT EXISTS public.user_weekly_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tasks JSONB DEFAULT '[]'::jsonb,
    focus TEXT CHECK (focus IN ('work', 'learning', 'personal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Create user_streaks table
CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for user_todos
CREATE POLICY "Users can view their own todos" 
    ON public.user_todos FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" 
    ON public.user_todos FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" 
    ON public.user_todos FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" 
    ON public.user_todos FOR DELETE 
    USING (auth.uid() = user_id);

-- Create policies for user_weekly_plans
CREATE POLICY "Users can view their own weekly plans" 
    ON public.user_weekly_plans FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly plans" 
    ON public.user_weekly_plans FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly plans" 
    ON public.user_weekly_plans FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly plans" 
    ON public.user_weekly_plans FOR DELETE 
    USING (auth.uid() = user_id);

-- Create policies for user_streaks
CREATE POLICY "Users can view their own streaks" 
    ON public.user_streaks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" 
    ON public.user_streaks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" 
    ON public.user_streaks FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_todos_updated_at
    BEFORE UPDATE ON public.user_todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_weekly_plans_updated_at
    BEFORE UPDATE ON public.user_weekly_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
