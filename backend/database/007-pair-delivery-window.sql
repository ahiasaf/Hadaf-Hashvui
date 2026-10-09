CREATE OR REPLACE FUNCTION claim_notification_outbox(limit_ integer) RETURNS SETOF notification_outbox LANGUAGE plpgsql AS $hadaf$
DECLARE row_ notification_outbox;
BEGIN
 IF limit_ NOT BETWEEN 1 AND 64 THEN RAISE EXCEPTION 'Invalid batch size'; END IF;
 FOR row_ IN SELECT * FROM notification_outbox WHERE state IN ('queued','failed') AND attempts<3 AND next_attempt_at<=now() AND NOT (coalesce(payload->>'tag','')='pair' AND ((extract(isodow FROM now() AT TIME ZONE 'Asia/Jerusalem')=5 AND extract(hour FROM now() AT TIME ZONE 'Asia/Jerusalem')>=12) OR (extract(isodow FROM now() AT TIME ZONE 'Asia/Jerusalem')=6 AND extract(hour FROM now() AT TIME ZONE 'Asia/Jerusalem')<20))) ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT limit_ LOOP
  IF NOT claim_notification(row_.key) THEN
   UPDATE notification_outbox SET state='uncertain',updated_at=now() WHERE key=row_.key;
   CONTINUE;
  END IF;
  UPDATE notification_outbox SET state='sending',attempts=attempts+1,updated_at=now() WHERE key=row_.key RETURNING * INTO row_;
  RETURN NEXT row_;
 END LOOP;
END
$hadaf$;
