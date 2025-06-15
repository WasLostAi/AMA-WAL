-- Create agent_posts table for AI-generated content intended for syndication
CREATE TABLE IF NOT EXISTS agent_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT, -- Optional title for internal reference
    content TEXT NOT NULL, -- The generated content (e.g., tweet, LinkedIn post)
    platform TEXT NOT NULL, -- 'twitter', 'linkedin', 'medium', 'github'
    content_type TEXT NOT NULL, -- 'tweet', 'linkedin-post', 'blog-excerpt', 'code-snippet'
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'syndicated', 'failed', 'draft'
    syndicated_at TIMESTAMPTZ, -- When it was actually posted
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- Store additional structured data like hashtags, character counts, etc.
);

-- Create a function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before each update on agent_posts
DROP TRIGGER IF EXISTS set_timestamp_agent_posts ON agent_posts;
CREATE TRIGGER set_timestamp_agent_posts
BEFORE UPDATE ON agent_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for faster lookup
CREATE INDEX IF NOT EXISTS idx_agent_posts_platform ON agent_posts (platform);
CREATE INDEX IF NOT EXISTS idx_agent_posts_status ON agent_posts (status);
CREATE INDEX IF NOT EXISTS idx_agent_posts_generated_at ON agent_posts (generated_at DESC);
