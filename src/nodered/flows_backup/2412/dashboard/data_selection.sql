--- select critertas for data selection ---

SELECT cycle_id 
FROM ${data_table} 
WHERE endpoint = ${endpoint_id} 
ORDER BY created_at DESC 
LIMIT 1

SELECT limestone_cycle, limestone_cycle_setpoint, lime_cycle, nominal_prod, shaft1_strokes, shaft2_strokes
FROM (
    SELECT limestone_cycle, limestone_cycle_setpoint, lime_cycle, nominal_prod, shaft1_strokes, shaft2_strokes
    FROM ${data_table}
    WHERE endpoint = ${endpoint_id}
    ORDER BY created_at DESC
    LIMIT 10
) subquery
ORDER BY created_at ASC;



SELECT created_at, lime_cycle, nominal_prod
FROM ${data_table} 
WHERE endpoint = ${endpoint_id} 
ORDER BY created_at DESC 
LIMIT 1000

--- select critertas for data selection dynamic time ---

SELECT cycle_time, cycle_disabled_time
FROM ${data_table}
WHERE endpoint = ${endpoint_id} 
  AND $__timeFilter(created_at)


SELECT cycle_time, cycle_disabled_time
FROM ${data_table}
WHERE endpoint = ${endpoint_id} 
  AND created_at > to_timestamp(${__from} / 1000)
  AND created_at < to_timestamp(${__to} / 1000)

--- production data bar chart ---
WITH temp AS (
  SELECT 
    created_at,
    CASE 
      WHEN ${interval} * INTERVAL '1 second' < INTERVAL '1 day' 
        THEN date_bin(${interval} * INTERVAL '1 second', created_at, TIMESTAMP 'epoch')
      WHEN ${interval} * INTERVAL '1 second' < INTERVAL '7 days' 
        THEN date_trunc('day', created_at)
      WHEN ${interval} * INTERVAL '1 second' < INTERVAL '21 days' 
        THEN date_trunc('week', created_at)
      WHEN ${interval} * INTERVAL '1 second' < INTERVAL '70 days' 
        THEN date_trunc('month', created_at)
      WHEN ${interval} * INTERVAL '1 second' < INTERVAL '365 days' 
        THEN date_trunc('quarter', created_at)
      WHEN ${interval} * INTERVAL '1 second' >= INTERVAL '365 days' 
        THEN date_trunc('year', created_at)
      ELSE date_trunc('day', created_at)
    END AS time,
    limestone_cycle,
    lime_cycle
  FROM ${data_table}
  WHERE endpoint = ${endpoint_id}
  AND $__timeFilter(created_at)
)
SELECT 
  time,
  extract(epoch from (time + ${interval} * INTERVAL '1 second')::timestamp AT TIME ZONE 'UTC') * 1000 AS to_time, -- necessary for data link
  SUM(limestone_cycle) AS total_limestone,
  SUM(lime_cycle) AS total_lime
FROM temp
GROUP BY time
ORDER BY time ASC;

-- Data Link with time range
-- /d/ee95strjzpn28b/lime-klin-cycle-details?orgId=1&from=${__value.time:ms}&to=${__data.fields.to_time}&timezone=browser&var-endpoint=${endpoint}&var-endpoint_id=${endpoint_id}&var-tag_table=${tag_table}&var-data_table=${data_table}

-- Data Link precise time (must be no aggregation in query)
-- /d/ee95strjzpn28b/lime-klin-cycle-details?orgId=1&from=${__value.time}&to=${__value.time}&timezone=browser&var-endpoint=${endpoint}&var-endpoint_id=${endpoint_id}&var-tag_table=${tag_table}&var-data_table=${data_table}



-- Mean rate with previous interval comparison 
WITH time_ranges AS (
    SELECT 
        MIN(created_at) AS min_time,
        MAX(created_at) AS max_time
    FROM ${data_table}
    WHERE endpoint = ${endpoint_id}
      AND created_at BETWEEN TO_TIMESTAMP((${__to}/1000) - ${interval}) 
                          AND TO_TIMESTAMP(${__to}/1000)
),

previous_time_ranges AS (
    SELECT 
        MIN(created_at) AS min_time,
        MAX(created_at) AS max_time
    FROM ${data_table}
    WHERE endpoint = ${endpoint_id}
      AND created_at BETWEEN TO_TIMESTAMP((${__to}/1000) - 2 * ${interval})
                          AND TO_TIMESTAMP((${__to}/1000) - ${interval})
)

SELECT 
    'previous' AS period,
    SUM(nominal_prod) / 1000 / (${time_range} / 3600.0) AS rate
FROM ${data_table}, previous_time_ranges
WHERE endpoint = ${endpoint_id}
  AND created_at BETWEEN 
      CASE WHEN previous_time_ranges.min_time = previous_time_ranges.max_time
           THEN (SELECT MAX(created_at) FROM ${data_table} WHERE created_at < previous_time_ranges.min_time)
           ELSE previous_time_ranges.min_time
      END
      AND previous_time_ranges.max_time

UNION ALL

SELECT 
    'current' AS period,
    SUM(nominal_prod) / 1000 / (${time_range} / 3600.0) AS rate
FROM ${data_table}, time_ranges
WHERE endpoint = ${endpoint_id}
  AND created_at BETWEEN 
      CASE WHEN time_ranges.min_time = time_ranges.max_time
           THEN (SELECT MAX(created_at) FROM ${data_table} WHERE created_at < time_ranges.min_time)
           ELSE time_ranges.min_time
      END
      AND time_ranges.max_time


-- Mean rate with previous interval comparison pure time

SELECT 
    'previous' AS period,
    SUM(nominal_prod) / 1000 / (${interval} / 3600.0) AS rate
FROM ${data_table}
WHERE endpoint = ${endpoint_id}
  AND created_at BETWEEN TO_TIMESTAMP((${__to}/1000) - ${interval}) 
                          AND TO_TIMESTAMP(${__to}/1000)

UNION ALL

SELECT 
    'current' AS period,
    SUM(nominal_prod) / 1000 / (${interval} / 3600.0) AS rate
FROM ${data_table}
WHERE endpoint = ${endpoint_id}
  AND created_at BETWEEN TO_TIMESTAMP((${__to}/1000) - 2 * ${interval})
                          AND TO_TIMESTAMP((${__to}/1000) - ${interval})


-- Mean rate with previous period comparison pure time

SELECT 
    'previous' AS period,
    SUM(nominal_prod) / 1000 / (${time_range} / 3600.0) AS rate
FROM ${data_table}
WHERE endpoint = ${endpoint_id}
  AND created_at BETWEEN TO_TIMESTAMP((${__from}/1000) - ${time_range})
                          AND TO_TIMESTAMP((${__from}/1000))

UNION ALL

SELECT 
    'current' AS period,
    SUM(nominal_prod) / 1000 / (${time_range} / 3600.0) AS rate
FROM ${data_table}
WHERE endpoint = ${endpoint_id}
  AND created_at BETWEEN TO_TIMESTAMP((${__from}/1000)) 
                          AND TO_TIMESTAMP(${__to}/1000)



-- Mean Rate

SELECT 
    SUM(nominal_prod) / 1000 / (${time_range} / 3600.0) AS rate
FROM ${data_table}
WHERE endpoint = ${endpoint_id}
  AND created_at BETWEEN TO_TIMESTAMP((${__from}/1000)) 
                          AND TO_TIMESTAMP(${__to}/1000)


-- Total with previous period comparison
SELECT
    'previous' AS period,
    SUM(nominal_prod) AS total
FROM ${data_table}
WHERE endpoint = ${endpoint_id}
  AND created_at BETWEEN
      -- start previous period
      (TO_TIMESTAMP(${__from}/1000)
       - (TO_TIMESTAMP(${__to}/1000) - TO_TIMESTAMP(${__from}/1000)))
      -- end previous period
      AND TO_TIMESTAMP(${__from}/1000)

UNION ALL

SELECT
    'current' AS period,
    SUM(nominal_prod) AS total
FROM ${data_table}
WHERE endpoint = ${endpoint_id}
  AND created_at BETWEEN
      TO_TIMESTAMP(${__from}/1000)
      AND TO_TIMESTAMP(${__to}/1000);









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
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '1 day' 
        THEN date_bin(${__interval_ms} * INTERVAL '1 millisecond', created_at + ((TCY + TStop) * INTERVAL '1 second'), TIMESTAMP 'epoch')
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '7 days' 
        THEN date_trunc('day', created_at + ((TCY + TStop) * INTERVAL '1 second'))
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '21 days' 
        THEN date_trunc('week', created_at + ((TCY + TStop) * INTERVAL '1 second'))
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '70 days' 
        THEN date_trunc('month', created_at + ((TCY + TStop) * INTERVAL '1 second'))
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' < INTERVAL '365 days' 
        THEN date_trunc('quarter', created_at + ((TCY + TStop) * INTERVAL '1 second'))
      WHEN ${__interval_ms} * INTERVAL '1 millisecond' >= INTERVAL '365 days' 
        THEN date_trunc('year', created_at + ((TCY + TStop) * INTERVAL '1 second'))
    END AS time,
    TOff1, 
    TOff2,
    TOff3,
    TOff4
  FROM ${data_table}
  WHERE endpoint = ${endpoint_id}
  AND $__timeFilter(created_at)
)
SELECT 
  time,
  (extract(epoch from MIN(created_at))*1000)::TEXT AS from_time,
  (extract(epoch from MAX(created_at))*1000)::TEXT AS to_time,
  SUM(TOff1) AS "Mechanical Issue Time",
  SUM(TOff2) AS "Electrical Issue Time",
  SUM(TOff3) AS "Process Issue Time",
  SUM(TOff4) AS "Other Issue Time"
FROM temp
GROUP BY time
ORDER BY time ASC;




WITH temp AS (
  SELECT 
    created_at AS time_start,
    created_at + ((TCY + TStop) * INTERVAL '1 second') AS time_end,
    LCY AS value
  FROM ${data_table}
  WHERE endpoint = ${endpoint_id}
    AND $__timeFilter(created_at) 
)
SELECT
  SUM(value) / extract(epoch from (max(time_end) - min(time_start))) * 3.6 AS "Lime Rate"
FROM temp
  