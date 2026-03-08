-- Fix stuck promoted property that had its promotion request deleted
UPDATE properties SET is_promoted = false, promotion_impression_count = 0 WHERE id = 'c841522e-1cd3-4f1e-8bf4-0437b07c271c';