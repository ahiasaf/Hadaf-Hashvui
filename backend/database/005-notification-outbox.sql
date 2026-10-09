CREATE TABLE notification_outbox (
 key text PRIMARY KEY,
 sid text NOT NULL,
 subscription jsonb NOT NULL,
 payload jsonb NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','sending','sent','failed','gone','uncertain')),
 attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_outbox_due ON notification_outbox(next_attempt_at) WHERE state IN ('queued','failed');
CREATE OR REPLACE FUNCTION claim_notification_outbox(limit_ integer) RETURNS SETOF notification_outbox LANGUAGE plpgsql AS $hadaf$
DECLARE row_ notification_outbox;
BEGIN
 IF limit_ NOT BETWEEN 1 AND 64 THEN RAISE EXCEPTION 'Invalid batch size'; END IF;
 FOR row_ IN SELECT * FROM notification_outbox WHERE state IN ('queued','failed') AND attempts<3 AND next_attempt_at<=now() ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT limit_ LOOP
  IF NOT claim_notification(row_.key) THEN
   UPDATE notification_outbox SET state='uncertain',updated_at=now() WHERE key=row_.key;
   CONTINUE;
  END IF;
  UPDATE notification_outbox SET state='sending',attempts=attempts+1,updated_at=now() WHERE key=row_.key RETURNING * INTO row_;
  RETURN NEXT row_;
 END LOOP;
END
$hadaf$;
CREATE OR REPLACE FUNCTION settle_notification_outbox(key_ text,state_ text) RETURNS boolean LANGUAGE plpgsql AS $hadaf$
DECLARE settled_ boolean;
BEGIN
 IF state_ NOT IN ('sent','failed','gone','uncertain') THEN RAISE EXCEPTION 'Invalid outbox settlement'; END IF;
 IF state_='uncertain' THEN
  UPDATE notification_outbox SET state=state_,updated_at=now() WHERE key=key_ AND state='sending';
  RETURN FOUND;
 END IF;
 settled_:=settle_notification(key_,CASE state_ WHEN 'sent' THEN 'נשלח' WHEN 'gone' THEN 'פג:outbox' ELSE 'נכשל' END);
 IF NOT settled_ THEN RETURN false; END IF;
 UPDATE notification_outbox SET state=state_,next_attempt_at=now()+interval '1 minute',updated_at=now() WHERE key=key_ AND state='sending';
 RETURN FOUND;
END
$hadaf$;
CREATE TABLE notification_requests (sid text PRIMARY KEY, payload_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE OR REPLACE FUNCTION enqueue_notification_request(sid_ text,hash_ text,columns_ jsonb,deliveries_ jsonb) RETURNS boolean LANGUAGE plpgsql AS $hadaf$
DECLARE previous_ text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(sid_,1736901323));
 SELECT payload_hash INTO previous_ FROM notification_requests WHERE sid=sid_;
 IF FOUND THEN
  IF previous_<>hash_ THEN RAISE EXCEPTION 'Notification request identity reused with different content'; END IF;
  RETURN false;
 END IF;
 INSERT INTO notification_requests(sid,payload_hash) VALUES(sid_,hash_);
 PERFORM append_sheet_record('הודעות',columns_);
 INSERT INTO notification_outbox(key,sid,subscription,payload) SELECT key,sid,subscription,payload FROM jsonb_to_recordset(deliveries_) AS input(key text,sid text,subscription jsonb,payload jsonb);
 RETURN true;
END
$hadaf$;
