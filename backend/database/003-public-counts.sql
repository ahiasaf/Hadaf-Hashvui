CREATE OR REPLACE VIEW public_registration_counts AS
WITH students AS (SELECT * FROM people WHERE role='kid' AND NOT is_test AND school_code<>''),
grades AS (SELECT school_code,string_agg(grade || ':' || total,' · ' ORDER BY grade) AS labels FROM (SELECT school_code,grade,count(*) AS total FROM students WHERE grade<>'' GROUP BY school_code,grade) g GROUP BY school_code),
ways AS (SELECT school_code,string_agg(way || ':' || total,' · ' ORDER BY way) AS labels FROM (SELECT school_code,details->>'מסגרת' AS way,count(*) AS total FROM students WHERE coalesce(details->>'מסגרת','')<>'' GROUP BY school_code,details->>'מסגרת') w GROUP BY school_code)
SELECT s.school_code,count(*) AS total,coalesce(g.labels,'') AS grades,coalesce(w.labels,'') AS ways
FROM students s LEFT JOIN grades g USING(school_code) LEFT JOIN ways w USING(school_code)
GROUP BY s.school_code,g.labels,w.labels;
CREATE OR REPLACE VIEW public_completion_counts AS
WITH completed AS (
 SELECT DISTINCT coalesce(a.person_id,e.device_id) AS person_id,e.track,e.week,btrim(e.details->>'קוד ישיבה') AS school_code
 FROM progress_events e LEFT JOIN person_aliases a ON a.alias_id=e.device_id
 WHERE e.is_complete AND NOT e.is_test AND coalesce(btrim(e.details->>'קוד ישיבה'),'')<>''
)
SELECT track,week,school_code,count(*) AS total FROM completed GROUP BY track,week,school_code;
CREATE OR REPLACE VIEW public_sheet_rows AS
SELECT table_name,ordinal::bigint,cells FROM sheet_rows WHERE table_name NOT IN ('מונים','מוני-לימוד')
UNION ALL
SELECT 'מונים',row_number() OVER (ORDER BY school_code),jsonb_build_array(school_code,total::text,grades,ways) FROM public_registration_counts
UNION ALL
SELECT 'מוני-לימוד',row_number() OVER (ORDER BY track,week,school_code),jsonb_build_array(track,week::text,school_code,total::text) FROM public_completion_counts;
CREATE OR REPLACE VIEW public_sheet_headers AS
SELECT name,headers FROM sheet_tables WHERE name NOT IN ('מונים','מוני-לימוד')
UNION ALL SELECT 'מונים','["קוד ישיבה","מצטרפים","שכבות","מסגרות"]'::jsonb
UNION ALL SELECT 'מוני-לימוד','["מסלול","שבוע","קוד ישיבה","סיימו"]'::jsonb;
