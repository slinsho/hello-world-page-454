-- Step 1: Convert property_type column to text temporarily
ALTER TABLE properties ALTER COLUMN property_type TYPE text;

-- Step 2: Update existing values
UPDATE properties SET property_type = 'shop' WHERE property_type = 'land';
UPDATE properties SET property_type = 'shop' WHERE property_type = 'commercial';

-- Step 3: Drop old enum and create new one
DROP TYPE IF EXISTS property_type CASCADE;
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'shop');

-- Step 4: Convert column back to enum
ALTER TABLE properties ALTER COLUMN property_type TYPE property_type USING property_type::property_type;

-- Step 5: Do the same for listing_type
ALTER TABLE properties ALTER COLUMN listing_type TYPE text;
DROP TYPE IF EXISTS listing_type CASCADE;
CREATE TYPE listing_type AS ENUM ('for_sale', 'for_rent', 'for_lease');
ALTER TABLE properties ALTER COLUMN listing_type TYPE listing_type USING listing_type::listing_type;