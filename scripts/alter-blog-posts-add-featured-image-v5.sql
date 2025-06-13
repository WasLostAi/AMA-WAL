-- Add the 'featured_image_url' column to the 'blog_posts' table if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='featured_image_url') THEN
        ALTER TABLE blog_posts ADD COLUMN featured_image_url TEXT;
        RAISE NOTICE 'Column "featured_image_url" added to table "blog_posts".';
    ELSE
        RAISE NOTICE 'Column "featured_image_url" already exists in table "blog_posts". No action taken.';
    END IF;
END
$$;
