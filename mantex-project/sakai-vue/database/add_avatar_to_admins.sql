-- Add avatar_url to admins table
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add comment
COMMENT ON COLUMN public.admins.avatar_url IS 'S3 key or URL for admin avatar image';
