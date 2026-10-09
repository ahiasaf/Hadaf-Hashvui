CREATE OR REPLACE FUNCTION queue_notification_failure_event() RETURNS trigger LANGUAGE plpgsql AS $hadaf$
DECLARE sid_ text;
BEGIN
 IF NEW.table_name<>'הודעות' OR coalesce(NEW.record->>'מי','')='מערכת' OR coalesce(NEW.record->>'תוצאה','') NOT LIKE 'נכשלה%' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND coalesce(OLD.record->>'תוצאה','') LIKE 'נכשלה%' THEN RETURN NEW; END IF;
 sid_:=NEW.record->>'מזהה שליחה';
 IF coalesce(sid_,'')='' THEN RETURN NEW; END IF;
 INSERT INTO notification_events(key,payload) VALUES('failure|'||sid_,NEW.record) ON CONFLICT(key) DO NOTHING;
 RETURN NEW;
END
$hadaf$;
CREATE TRIGGER queue_notification_failure AFTER INSERT OR UPDATE ON sheet_rows FOR EACH ROW EXECUTE FUNCTION queue_notification_failure_event();
