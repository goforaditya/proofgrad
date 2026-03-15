-- Add slug column to articles table
ALTER TABLE articles ADD COLUMN slug TEXT;

-- Generate slugs for existing articles from their titles
UPDATE articles
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
);

-- Make slug NOT NULL and UNIQUE after backfilling
ALTER TABLE articles ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX articles_slug_unique ON articles (slug);
