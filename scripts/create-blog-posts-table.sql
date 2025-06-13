-- Create blog_posts table for storing AI-generated blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- SEO-friendly URL slug
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown or HTML content of the blog post
    description TEXT NOT NULL, -- Short description for meta tags
    tags TEXT[], -- Array of tags for categorization and SEO
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on the slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
