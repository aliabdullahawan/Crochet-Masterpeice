-- Run once on existing database to allow cart-level discounts.
-- This adds the fourth applies_to option: cart

ALTER TABLE discounts
  DROP CONSTRAINT IF EXISTS discounts_applies_to_check;

ALTER TABLE discounts
  ADD CONSTRAINT discounts_applies_to_check
  CHECK (applies_to IN ('all', 'product', 'category', 'cart'));
