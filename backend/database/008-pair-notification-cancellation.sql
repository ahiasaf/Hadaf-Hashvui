ALTER TABLE notification_outbox DROP CONSTRAINT notification_outbox_state_check;
ALTER TABLE notification_outbox ADD CONSTRAINT notification_outbox_state_check CHECK(state IN ('queued','sending','sent','failed','gone','uncertain','cancelled'));
CREATE OR REPLACE FUNCTION queue_pair_notification_event() RETURNS trigger LANGUAGE plpgsql AS $hadaf$
DECLARE key_ text;
BEGIN
 IF NEW.table_name<>'זוגות' THEN RETURN NEW; END IF;
 IF coalesce(NEW.record->>'מזהה','')='' OR coalesce(NEW.record->>'מסלול','')='' OR coalesce(NEW.record->>'שבוע','')='' THEN RETURN NEW; END IF;
 key_:='pr|'||(NEW.record->>'מזהה')||'|'||(NEW.record->>'מסלול')||'|'||(NEW.record->>'שבוע');
 IF NEW.record->>'בלי התראה'='כן' OR (coalesce(NEW.record->>'דיווח','')<>'ההורה' AND NEW.record->>'אושר'='כן') THEN
  UPDATE notification_outbox SET state='cancelled',updated_at=now() WHERE key=key_ AND state IN ('queued','failed');
  UPDATE notification_events SET resolved=true,payload=NEW.record WHERE key=key_;
  RETURN NEW;
 END IF;
 INSERT INTO notification_events(key,payload) VALUES(key_,NEW.record) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload WHERE NOT notification_events.resolved;
 RETURN NEW;
END
$hadaf$;
