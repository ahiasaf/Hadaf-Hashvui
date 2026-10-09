ALTER TABLE sheet_tables ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 1;
CREATE OR REPLACE FUNCTION phone_key(value text) RETURNS text LANGUAGE sql IMMUTABLE AS $hadaf$
 SELECT CASE WHEN length(cleaned) >= 8 THEN cleaned ELSE '' END
 FROM (SELECT regexp_replace(regexp_replace(regexp_replace(value, '[^0-9]', '', 'g'), '^972', ''), '^0', '') AS cleaned) p
$hadaf$;
CREATE OR REPLACE FUNCTION name_key(value text) RETURNS text LANGUAGE sql IMMUTABLE AS $hadaf$
 SELECT regexp_replace(value, '["''׳״[:space:]]', '', 'g')
$hadaf$;
ALTER TABLE people ADD COLUMN IF NOT EXISTS identity_key text GENERATED ALWAYS AS (
 CASE WHEN phone_key(phone) <> '' AND name_key(first_name) <> '' AND name_key(last_name) <> ''
 THEN phone_key(phone) || '|' || name_key(first_name) || '|' || name_key(last_name) || '|' || role ELSE '' END
) STORED;
CREATE INDEX IF NOT EXISTS people_identity_key ON people(identity_key) WHERE identity_key <> '';
CREATE INDEX IF NOT EXISTS people_phone_key ON people(phone_key(phone),role);
CREATE INDEX IF NOT EXISTS people_parent_phone ON people(phone_key(details->>'טלפון ההורה'),role);
CREATE INDEX IF NOT EXISTS people_inviter ON people((details->>'מזהה המזמין'));
CREATE INDEX IF NOT EXISTS sheet_lesson_key ON sheet_rows(table_name,(cells->>0),(cells->>1));
CREATE OR REPLACE FUNCTION sheet_record(headers jsonb, cells jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $hadaf$
 SELECT coalesce(jsonb_object_agg(header,coalesce(cells->>(position::int-1),'')) FILTER (WHERE header <> ''),'{}'::jsonb)
 FROM jsonb_array_elements_text(headers) WITH ORDINALITY AS h(header,position)
$hadaf$;
CREATE OR REPLACE FUNCTION sync_sheet_record() RETURNS trigger LANGUAGE plpgsql AS $hadaf$
DECLARE
 tab text; values_ jsonb; headers_ jsonb; person text; row_ sheet_rows; alias_ text; segment_ text; total_ integer; at_ integer;
BEGIN
 tab := CASE WHEN TG_OP = 'DELETE' THEN OLD.table_name ELSE NEW.table_name END;
 IF tab NOT IN ('לומדים','לימוד') THEN RETURN NULL; END IF;
 SELECT headers INTO headers_ FROM sheet_tables WHERE name=tab;
 values_ := sheet_record(headers_,CASE WHEN TG_OP = 'DELETE' THEN OLD.cells ELSE NEW.cells END);
 IF tab='לומדים' THEN
  person := btrim(coalesce(values_->>'מזהה',''));
  IF person='' THEN RETURN NULL; END IF;
  SELECT * INTO row_ FROM sheet_rows WHERE table_name=tab AND cells->>((SELECT position::int-1 FROM jsonb_array_elements_text(headers_) WITH ORDINALITY h(header,position) WHERE header='מזהה'))=person ORDER BY ordinal DESC LIMIT 1;
   IF NOT FOUND THEN DELETE FROM person_aliases WHERE person_id=person; DELETE FROM people WHERE id=person; RETURN NULL; END IF;
  values_ := sheet_record(headers_,row_.cells);
  INSERT INTO people(id,school_code,role,first_name,last_name,phone,grade,class_name,is_test,details)
  VALUES(person,coalesce(values_->>'קוד ישיבה',''),CASE WHEN values_->>'תפקיד'='הורה' THEN 'dad' ELSE 'kid' END,coalesce(values_->>'שם',''),coalesce(values_->>'משפחה',''),coalesce(values_->>'טלפון',''),coalesce(values_->>'שכבה',''),coalesce(values_->>'כיתה',''),coalesce(values_->>'בדיקה','')='כן',values_)
  ON CONFLICT(id) DO UPDATE SET school_code=EXCLUDED.school_code,role=EXCLUDED.role,first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,phone=EXCLUDED.phone,grade=EXCLUDED.grade,class_name=EXCLUDED.class_name,is_test=EXCLUDED.is_test,details=EXCLUDED.details;
  DELETE FROM person_aliases WHERE person_id=person;
  FOR alias_ IN SELECT DISTINCT value FROM unnest(ARRAY[person] || regexp_split_to_array(coalesce(values_->>'מזהים נוספים',''),'\s+')) value WHERE value<>'' LOOP
   INSERT INTO person_aliases(alias_id,person_id) VALUES(alias_,person);
  END LOOP;
 ELSE
  IF TG_OP='DELETE' THEN DELETE FROM progress_events WHERE source_row=OLD.ordinal; RETURN NULL; END IF;
  IF btrim(coalesce(values_->>'מזהה',''))='' THEN DELETE FROM progress_events WHERE source_row=NEW.ordinal; RETURN NULL; END IF;
  IF values_->>'מסלול' NOT IN ('taanit','megila') OR coalesce(values_->>'שבוע','') !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'Invalid progress identity'; END IF;
  segment_ := btrim(coalesce(values_->>'קטע',''));
  total_ := CASE WHEN coalesce(values_->>'מתוך','') ~ '^[0-9]+$' THEN (values_->>'מתוך')::integer ELSE 0 END;
  at_ := CASE WHEN segment_ ~ '^[0-9]+$' THEN segment_::integer ELSE 0 END;
  INSERT INTO progress_events(source_row,device_id,track,week,is_complete,fraction,is_test,details)
  VALUES(NEW.ordinal,btrim(values_->>'מזהה'),values_->>'מסלול',(values_->>'שבוע')::integer,segment_='' OR total_<=0 OR at_>=total_,CASE WHEN segment_='' OR total_<=0 OR at_>=total_ THEN 1 ELSE greatest(0,least(1,at_::double precision/total_)) END,coalesce(values_->>'בדיקה','')='כן',values_)
  ON CONFLICT(source_row) DO UPDATE SET device_id=EXCLUDED.device_id,track=EXCLUDED.track,week=EXCLUDED.week,is_complete=EXCLUDED.is_complete,fraction=EXCLUDED.fraction,is_test=EXCLUDED.is_test,details=EXCLUDED.details;
 END IF;
 RETURN NULL;
END
$hadaf$;
DROP TRIGGER IF EXISTS sync_normalized_record ON sheet_rows;
CREATE TRIGGER sync_normalized_record AFTER INSERT OR UPDATE OR DELETE ON sheet_rows FOR EACH ROW EXECUTE FUNCTION sync_sheet_record();
CREATE OR REPLACE FUNCTION append_sheet_record(tab text, columns_ jsonb) RETURNS jsonb LANGUAGE plpgsql AS $hadaf$
DECLARE
 head jsonb; data_ jsonb; col jsonb; mapped jsonb; canonical text; requested text; identity_ text; ordinal_ integer; aliases_ text; position_ integer; updated_ boolean:=false;
BEGIN
 INSERT INTO sheet_tables(name,headers,metadata,source_hash,captured_at) VALUES(tab,'["תאריך"]','{}','runtime',now()) ON CONFLICT DO NOTHING;
 SELECT headers INTO head FROM sheet_tables WHERE name=tab FOR UPDATE;
 mapped := '{}'::jsonb;
 FOR col IN SELECT value FROM jsonb_array_elements(columns_) LOOP
  IF jsonb_typeof(col)<>'array' OR jsonb_array_length(col)<>2 OR jsonb_typeof(col->0)<>'string' OR jsonb_typeof(col->1)<>'string' THEN RAISE EXCEPTION 'Invalid columns'; END IF;
  IF col->>0='' THEN RAISE EXCEPTION 'Empty column'; END IF;
  mapped:=mapped || jsonb_build_object(col->>0,col->>1);
 END LOOP;
 IF tab='לומדים' THEN
  requested:=btrim(coalesce(mapped->>'מזהה',''));
  IF requested='' THEN RAISE EXCEPTION 'Missing device identity'; END IF;
  identity_:=phone_key(coalesce(mapped->>'טלפון','')) || '|' || name_key(coalesce(mapped->>'שם','')) || '|' || name_key(coalesce(mapped->>'משפחה','')) || '|' || CASE WHEN mapped->>'תפקיד'='הורה' THEN 'dad' ELSE 'kid' END;
  IF requested !~ ':k[0-9]+$' THEN SELECT id INTO canonical FROM people WHERE identity_key=identity_ AND identity_key<>'' AND id !~ ':k[0-9]+$' ORDER BY id LIMIT 1; END IF;
  IF canonical IS NULL THEN SELECT person_id INTO canonical FROM person_aliases WHERE alias_id=requested; END IF;
  canonical:=coalesce(canonical,requested);
  SELECT string_agg(alias_id,' ' ORDER BY alias_id) INTO aliases_ FROM person_aliases WHERE person_id=canonical AND alias_id<>canonical;
  IF canonical<>requested THEN aliases_:=concat_ws(' ',aliases_,requested); END IF;
  mapped:=mapped || jsonb_build_object('מזהה',canonical,'מזהים נוספים',coalesce(aliases_,''));
  SELECT ordinal,cells INTO ordinal_,data_ FROM sheet_rows WHERE table_name=tab AND sheet_record(head,cells)->>'מזהה'=canonical ORDER BY ordinal DESC LIMIT 1;
  updated_:=FOUND;
 END IF;
 IF ordinal_ IS NULL THEN SELECT coalesce(max(ordinal),0)+1 INTO ordinal_ FROM sheet_rows WHERE table_name=tab; END IF;
 mapped:=mapped || jsonb_build_object('תאריך',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
 FOR col IN SELECT jsonb_build_array(key,value) FROM jsonb_each_text(mapped) LOOP
  IF NOT head ? (col->>0) THEN head:=head || jsonb_build_array(col->>0); END IF;
 END LOOP;
 data_:=coalesce(data_,'[]'::jsonb);
 SELECT coalesce(jsonb_agg(coalesce(mapped->>header,data_->>(position::int-1),'' ) ORDER BY position),'[]'::jsonb) INTO data_ FROM jsonb_array_elements_text(head) WITH ORDINALITY h(header,position);
 UPDATE sheet_tables SET headers=head,revision=revision+1 WHERE name=tab;
 INSERT INTO sheet_rows(table_name,ordinal,cells) VALUES(tab,ordinal_,data_) ON CONFLICT(table_name,ordinal) DO UPDATE SET cells=EXCLUDED.cells;
 RETURN jsonb_build_object('status','success','tab',tab,'columns',jsonb_array_length(head),'updated',updated_,'id',canonical);
END
$hadaf$;

ALTER TABLE sheet_rows ADD COLUMN IF NOT EXISTS record jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE FUNCTION prepare_sheet_record() RETURNS trigger LANGUAGE plpgsql AS $hadaf$
BEGIN
 SELECT sheet_record(headers,NEW.cells) INTO NEW.record FROM sheet_tables WHERE name=NEW.table_name;
 RETURN NEW;
END
$hadaf$;
DROP TRIGGER IF EXISTS prepare_record ON sheet_rows;
CREATE TRIGGER prepare_record BEFORE INSERT OR UPDATE ON sheet_rows FOR EACH ROW EXECUTE FUNCTION prepare_sheet_record();
UPDATE sheet_rows r SET record=sheet_record(t.headers,r.cells) FROM sheet_tables t WHERE r.table_name=t.name;
CREATE INDEX IF NOT EXISTS sheet_device_identity ON sheet_rows(table_name,(record->>'מזהה'));
CREATE INDEX IF NOT EXISTS sheet_message_identity ON sheet_rows(table_name,(record->>'מזהה שליחה'));
CREATE INDEX IF NOT EXISTS sheet_phone_identity ON sheet_rows(table_name,phone_key(record->>'טלפון'));
CREATE OR REPLACE FUNCTION replace_sheet_table(tab text, headers_ jsonb, rows_ jsonb) RETURNS jsonb LANGUAGE plpgsql AS $hadaf$
DECLARE row_ jsonb; position_ integer:=0;
BEGIN
 INSERT INTO sheet_tables(name,headers,metadata,source_hash,captured_at) VALUES(tab,headers_,'{}','runtime',now()) ON CONFLICT DO NOTHING;
 PERFORM name FROM sheet_tables WHERE name=tab FOR UPDATE;
 DELETE FROM sheet_rows WHERE table_name=tab;
 UPDATE sheet_tables SET headers=headers_,revision=revision+1 WHERE name=tab;
 FOR row_ IN SELECT value FROM jsonb_array_elements(rows_) LOOP
  position_:=position_+1;
  INSERT INTO sheet_rows(table_name,ordinal,cells) VALUES(tab,position_,row_);
 END LOOP;
 RETURN jsonb_build_object('status','success','tab',tab,'rows',position_);
END
$hadaf$;
