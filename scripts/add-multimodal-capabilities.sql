-- Migration script to add multimodal capabilities support
-- This script adds capabilities table and many-to-many relationship with ai_models

-- Create capabilities table
CREATE TABLE IF NOT EXISTS "capabilities" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create many-to-many junction table between ai_models and capabilities
CREATE TABLE IF NOT EXISTS "ai_model_capabilities" (
    id SERIAL PRIMARY KEY,
    ai_model_id INTEGER NOT NULL REFERENCES "ai_models"(id) ON DELETE CASCADE,
    capability_id INTEGER NOT NULL REFERENCES "capabilities"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ai_model_id, capability_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_model_capabilities_model_id ON "ai_model_capabilities"(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_capabilities_capability_id ON "ai_model_capabilities"(capability_id);
CREATE INDEX IF NOT EXISTS idx_capabilities_name ON "capabilities"(name);

-- Insert default capabilities
INSERT INTO "capabilities" (name, display_name, description) VALUES
    ('text', 'Text Documents', 'Support for text-based documents and content'),
    ('images', 'Images', 'Support for image files (PNG, JPEG, GIF, WebP)'),
    ('audio', 'Audio', 'Support for audio files (MP3, WAV, M4A)')
ON CONFLICT (name) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE "capabilities" IS 'Defines available AI model capabilities (text, images, audio, etc.)';
COMMENT ON TABLE "ai_model_capabilities" IS 'Many-to-many relationship between AI models and their capabilities';