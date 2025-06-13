-- Add the 'generated_at' column to the 'blog_posts' table if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='generated_at') THEN
        ALTER TABLE blog_posts ADD COLUMN generated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Column "generated_at" added to table "blog_posts".';
    ELSE
        RAISE NOTICE 'Column "generated_at" already exists in table "blog_posts". No action taken.';
    END IF;

    -- Add the 'updated_at' column to the 'blog_posts' table if it doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='updated_at') THEN
        ALTER TABLE blog_posts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Column "updated_at" added to table "blog_posts".';
    ELSE
        RAISE NOTICE 'Column "updated_at" already exists in table "blog_posts". No action taken.';
    END IF;
END
$$;

-- Create or replace a function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace a trigger to call the function before each update on blog_posts
-- Ensure the trigger is dropped and recreated to apply any function changes
DROP TRIGGER IF EXISTS set_timestamp ON blog_posts;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
