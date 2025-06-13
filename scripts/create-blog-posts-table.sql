-- Create blog_posts table for storing AI-generated blog content
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- For SEO-friendly URLs
    content TEXT NOT NULL, -- Markdown content
    tags TEXT[], -- Array of tags for categorization
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft' or 'published'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add an index to the slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
