--- Data Tables x specific type ---

SELECT process_table
FROM config.tag_tables
WHERE name IN (
	SELECT unnest(
	    string_to_array(
	        replace(replace(replace(tag_tables, '[', ''), ']', ''), '"', ''), ','
	    )
	)
    FROM config.endpoints
    WHERE machine IN (
        SELECT name
        FROM config.machines
        WHERE type = 'ABC'
    )
);


--- Endpoint Names ---

SELECT name
FROM config.endpoints
ORDER BY id ASC;

--- Endpoint Id ---

SELECT id
FROM config.endpoints
WHERE name = '${endpoint}';

--- Tag Tables x Selected Endpoint ---

SELECT name
FROM config.tag_tables
WHERE name IN (
    SELECT unnest(
            string_to_array(
                replace(replace(replace(tag_tables, '[', ''), ']', ''), '"', ''), ','
            )
        )
    FROM config.endpoints
    WHERE name = '${endpoint}'
);

SELECT process_table
FROM config.tag_tables
WHERE name == '${tag_table}';

--- Tag Table Lables ---
SELECT DISTINCT label
FROM tags.${tag_table}
ORDER BY label ASC;




WITH temp AS (
  SELECT 
    created_at,
    CASE 
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '1 day' 
        THEN date_bin(${__interval_ms} * INTERVAL '1 millisecond', created_at, TIMESTAMP 'epoch')
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '7 days' 
        THEN date_trunc('day', created_at)
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '21 days' 
        THEN date_trunc('week', created_at)
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '70 days' 
        THEN date_trunc('month', created_at)
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '365 days' 
        THEN date_trunc('quarter', created_at)
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' >= INTERVAL '365 days' 
        THEN date_trunc('year', created_at)
    END AS time,
    TStop
  FROM ${data_table}
  WHERE endpoint = ${endpoint_id}
  AND $__timeFilter(created_at)
)
SELECT 
  time,
  (extract(epoch from time) * 1000)::TEXT  AS from_time,
  ((extract(epoch from time) * 1000) + ${__interval_ms})::TEXT AS to_time,
  SUM(TStop) AS "Cycle Disabled"
FROM temp
GROUP BY time
ORDER BY time ASC;



WITH temp AS (
  SELECT 
    created_at,
    CASE 
      WHEN ${interval_ms} * INTERVAL '1 millisecond' < INTERVAL '1 day' 
        THEN date_bin(${interval_ms} * INTERVAL '1 millisecond', created_at, TIMESTAMP 'epoch')
      WHEN ${interval_ms} * INTERVAL '1 millisecond' < INTERVAL '7 days' 
        THEN date_trunc('day', created_at)
      WHEN ${interval_ms} * INTERVAL '1 millisecond' < INTERVAL '21 days' 
        THEN date_trunc('week', created_at)
      WHEN ${interval_ms} * INTERVAL '1 millisecond' < INTERVAL '70 days' 
        THEN date_trunc('month', created_at)
      WHEN ${interval_ms} * INTERVAL '1 millisecond' < INTERVAL '365 days' 
        THEN date_trunc('quarter', created_at)
      WHEN ${interval_ms} * INTERVAL '1 millisecond' >= INTERVAL '365 days' 
        THEN date_trunc('year', created_at)
    END AS time,
    NP
  FROM ${data_table}
  WHERE endpoint = ${endpoint_id}
  AND $__timeFilter(created_at)
)
SELECT 
  time,
  (extract(epoch from time) * 1000)::TEXT  AS from_time,
  ((extract(epoch from time) * 1000) + ${__interval_ms})::TEXT AS to_time,
  AVG(NP) AS "Nominal Production"
FROM temp
GROUP BY time
ORDER BY time ASC;