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




