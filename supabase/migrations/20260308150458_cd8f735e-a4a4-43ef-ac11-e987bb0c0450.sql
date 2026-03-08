-- Insert verification fee settings
INSERT INTO platform_settings (key, value) VALUES 
  ('owner_verification_fee_lrd', '500'),
  ('agent_verification_fee_usd', '20'),
  ('verification_duration_days', '5')
ON CONFLICT (key) DO NOTHING;