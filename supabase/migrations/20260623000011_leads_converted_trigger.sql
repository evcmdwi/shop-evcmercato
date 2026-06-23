-- 1. Backfill: tandai leads yang sudah jadi member sekarang
UPDATE leads
SET status = 'converted'
WHERE phone IN (SELECT phone FROM users WHERE phone IS NOT NULL)
  AND status != 'converted';

-- 2. Trigger: otomatis converted saat user baru register
CREATE OR REPLACE FUNCTION mark_lead_converted()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE leads SET status = 'converted', updated_at = NOW()
  WHERE phone = NEW.phone AND status != 'converted';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_mark_lead ON users;
CREATE TRIGGER on_user_created_mark_lead
  AFTER INSERT ON users
  FOR EACH ROW
  WHEN (NEW.phone IS NOT NULL)
  EXECUTE FUNCTION mark_lead_converted();
