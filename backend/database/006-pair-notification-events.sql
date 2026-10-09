CREATE TABLE notification_events (key text PRIMARY KEY,payload jsonb NOT NULL,resolved boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now());
CREATE OR REPLACE FUNCTION queue_pair_notification_event() RETURNS trigger LANGUAGE plpgsql AS $hadaf$
DECLARE key_ text;
BEGIN
 IF NEW.table_name<>'זוגות' THEN RETURN NEW; END IF;
 IF coalesce(NEW.record->>'מזהה','')='' OR coalesce(NEW.record->>'מסלול','')='' OR coalesce(NEW.record->>'שבוע','')='' THEN RETURN NEW; END IF;
 key_:='pr|'||(NEW.record->>'מזהה')||'|'||(NEW.record->>'מסלול')||'|'||(NEW.record->>'שבוע');
 INSERT INTO notification_events(key,payload) VALUES(key_,NEW.record) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload WHERE NOT notification_events.resolved;
 RETURN NEW;
END
$hadaf$;
CREATE TRIGGER queue_pair_event AFTER INSERT OR UPDATE ON sheet_rows FOR EACH ROW EXECUTE FUNCTION queue_pair_notification_event();
