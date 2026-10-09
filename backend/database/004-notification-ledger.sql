CREATE TABLE notification_deliveries (
 key text PRIMARY KEY CHECK(length(key) BETWEEN 1 AND 500),
 state text NOT NULL,
 attempts integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION claim_notification(key_ text) RETURNS boolean LANGUAGE plpgsql AS $hadaf$
DECLARE previous_ text;
BEGIN
 IF length(key_) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Invalid delivery key'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(key_,1736901322));
 SELECT state INTO previous_ FROM notification_deliveries WHERE key=key_;
 IF NOT FOUND THEN
  SELECT record->>'מצב' INTO previous_ FROM sheet_rows WHERE table_name='נשלחו' AND record->>'מפתח'=key_ ORDER BY ordinal DESC LIMIT 1;
 END IF;
 IF previous_ IS NOT NULL AND previous_<>'נכשל' AND previous_ NOT LIKE 'פג:%' THEN RETURN false; END IF;
 INSERT INTO notification_deliveries(key,state) VALUES(key_,'ממתין')
 ON CONFLICT(key) DO UPDATE SET state='ממתין',attempts=notification_deliveries.attempts+1,updated_at=now();
 PERFORM append_sheet_record('נשלחו',jsonb_build_array(jsonb_build_array('מפתח',key_),jsonb_build_array('מצב','ממתין'),jsonb_build_array('מתי',now()::text)));
 RETURN true;
END
$hadaf$;
CREATE OR REPLACE FUNCTION settle_notification(key_ text, state_ text) RETURNS boolean LANGUAGE plpgsql AS $hadaf$
BEGIN
 IF state_ NOT IN ('נשלח','נכשל') AND state_ NOT LIKE 'פג:%' THEN RAISE EXCEPTION 'Invalid delivery state'; END IF;
 UPDATE notification_deliveries SET state=state_,updated_at=now() WHERE key=key_ AND state='ממתין';
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM append_sheet_record('נשלחו',jsonb_build_array(jsonb_build_array('מפתח',key_),jsonb_build_array('מצב',state_),jsonb_build_array('מתי',now()::text)));
 RETURN true;
END
$hadaf$;
CREATE INDEX sheet_delivery_key ON sheet_rows(table_name,(record->>'מפתח'));
CREATE OR REPLACE FUNCTION report_notification(sid_ text,result_ text,running_ boolean) RETURNS boolean LANGUAGE plpgsql AS $hadaf$
DECLARE row_ sheet_rows; head_ jsonb; at_ integer; was_ text;
BEGIN
 PERFORM name FROM sheet_tables WHERE name='הודעות' FOR UPDATE;
 SELECT * INTO row_ FROM sheet_rows WHERE table_name='הודעות' AND record->>'מזהה שליחה'=sid_ ORDER BY ordinal DESC LIMIT 1;
 IF NOT FOUND THEN RETURN false; END IF;
 was_:=coalesce(row_.record->>'תוצאה','');
 IF was_ LIKE 'נכשלה%' OR (running_ AND was_<>'' AND was_<>'ממתין') THEN RETURN true; END IF;
 SELECT headers INTO head_ FROM sheet_tables WHERE name='הודעות';
 SELECT position::integer-1 INTO at_ FROM jsonb_array_elements_text(head_) WITH ORDINALITY h(header,position) WHERE header='תוצאה';
 IF at_ IS NULL THEN RAISE EXCEPTION 'Missing report column'; END IF;
 UPDATE sheet_rows SET cells=jsonb_set(cells,ARRAY[at_::text],to_jsonb(result_)) WHERE table_name=row_.table_name AND ordinal=row_.ordinal;
 UPDATE sheet_tables SET revision=revision+1 WHERE name='הודעות';
 RETURN true;
END
$hadaf$;
