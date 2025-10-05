-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create marketing_posts table
CREATE TABLE public.marketing_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  prompt TEXT,
  post_text TEXT NOT NULL,
  image_url TEXT,
  hashtags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own posts"
ON public.marketing_posts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts"
ON public.marketing_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.marketing_posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.marketing_posts
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_marketing_posts_user_id ON public.marketing_posts(user_id);
CREATE INDEX idx_marketing_posts_platform ON public.marketing_posts(platform);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_marketing_posts_updated_at
BEFORE UPDATE ON public.marketing_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();