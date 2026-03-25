-- Run this in Supabase SQL Editor
-- Revenue should count only delivered orders (not confirmed/shipped/pending)

CREATE OR REPLACE VIEW analytics_daily AS
SELECT
  DATE(created_at) AS date,
  COUNT(*)::INT AS order_count,
  COALESCE(SUM(total_amount), 0)::INT AS revenue,
  COALESCE(AVG(total_amount), 0)::INT AS avg_order_value
FROM orders
WHERE status = 'delivered'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;
