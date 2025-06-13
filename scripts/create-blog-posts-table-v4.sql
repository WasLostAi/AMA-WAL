-- Create blog_posts table for AI-generated articles
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- For SEO-friendly URLs
    content TEXT NOT NULL, -- Markdown content of the blog post
    keywords TEXT[], -- Array of keywords for SEO
    meta_description TEXT, -- Meta description for SEO
    status TEXT DEFAULT 'draft' NOT NULL, -- 'draft' or 'published'
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before each update on blog_posts
DROP TRIGGER IF EXISTS set_timestamp ON blog_posts;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create an index on slug for faster lookup
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
