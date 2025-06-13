-- Add the 'keywords' column to the 'blog_posts' table if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='keywords') THEN
        ALTER TABLE blog_posts ADD COLUMN keywords TEXT[];
        RAISE NOTICE 'Column "keywords" added to table "blog_posts".';
    ELSE
        RAISE NOTICE 'Column "keywords" already exists in table "blog_posts". No action taken.';
    END IF;
END
$$;
