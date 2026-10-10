-- The cutover tool creates this table before import so it can pause writes; keep both definitions identical.
CREATE TABLE IF NOT EXISTS cutover_state (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 state text NOT NULL CHECK (state IN ('frozen','active')),
 frozen_until timestamptz,
 activated_at timestamptz,
 source_hash text,
 report jsonb
);
CREATE OR REPLACE FUNCTION require_condition(ok boolean, message text) RETURNS boolean LANGUAGE plpgsql AS $hadaf$
BEGIN
 IF ok IS NOT TRUE THEN RAISE EXCEPTION '%', message; END IF;
 RETURN true;
END
$hadaf$;
-- Merges named cells into one existing row, adding unknown headers, like a Sheets cell edit.
CREATE OR REPLACE FUNCTION update_sheet_record(tab text, ordinal_ integer, columns_ jsonb) RETURNS jsonb LANGUAGE plpgsql AS $hadaf$
DECLARE head jsonb; data_ jsonb; mapped jsonb:='{}'::jsonb; col jsonb;
BEGIN
 SELECT headers INTO head FROM sheet_tables WHERE name=tab FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown table'; END IF;
 SELECT cells INTO data_ FROM sheet_rows WHERE table_name=tab AND ordinal=ordinal_;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown row'; END IF;
 FOR col IN SELECT value FROM jsonb_array_elements(columns_) LOOP
  IF jsonb_typeof(col)<>'array' OR jsonb_array_length(col)<>2 OR jsonb_typeof(col->0)<>'string' OR jsonb_typeof(col->1)<>'string' OR col->>0='' THEN RAISE EXCEPTION 'Invalid columns'; END IF;
  mapped:=mapped || jsonb_build_object(col->>0,col->>1);
  IF NOT head ? (col->>0) THEN head:=head || jsonb_build_array(col->>0); END IF;
 END LOOP;
 SELECT coalesce(jsonb_agg(coalesce(mapped->>header,data_->>(position::int-1),'') ORDER BY position),'[]'::jsonb) INTO data_ FROM jsonb_array_elements_text(head) WITH ORDINALITY h(header,position);
 UPDATE sheet_tables SET headers=head,revision=revision+1 WHERE name=tab;
 UPDATE sheet_rows SET cells=data_ WHERE table_name=tab AND ordinal=ordinal_;
 RETURN jsonb_build_object('status','success','tab',tab,'updated',true);
END
$hadaf$;
