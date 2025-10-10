-- Step 1: Drop old constraint FIRST (so we can update the data)
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_type_check;

-- Step 2: Migrate existing data from old product types to new canonical families
UPDATE products 
SET type = CASE 
  WHEN type = 'digital' THEN 'ebook'
  WHEN type = 'service' THEN 'session'
  WHEN type = 'physical' THEN 'bundle'
  ELSE type
END
WHERE type IN ('digital', 'service', 'physical');

-- Step 3: Add new constraint with canonical product family values
ALTER TABLE products 
ADD CONSTRAINT products_type_check 
CHECK (type = ANY (ARRAY[
  'template'::text,
  'ebook'::text,
  'session'::text,
  'course'::text,
  'email-pack'::text,
  'video'::text,
  'bundle'::text
]));