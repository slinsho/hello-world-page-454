-- Fix the property that was approved but not marked as promoted
UPDATE properties SET is_promoted = true WHERE id = 'c841522e-1cd3-4f1e-8bf4-0437b07c271c';