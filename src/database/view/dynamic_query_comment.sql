CREATE OR REPLACE FUNCTION dynamic_query_full_comment(
    data_table TEXT,
    tag_table TEXT,
    label TEXT,
    endpoint_id INT,
    __from BIGINT,
    __to BIGINT
)
RETURNS TABLE(created_at TIMESTAMP, result JSONB) AS $$
DECLARE
    sel_data RECORD; -- Record to hold name and comment
    sel_mapping JSONB; -- JSONB to hold name-comment mapping
    valid_columns TEXT[]; -- Array to hold valid columns from data_table
    query TEXT;       -- Dynamic query
BEGIN
    -- Step 1: Fetch all column names from the data_table
    EXECUTE format(
        'SELECT ARRAY(SELECT lower(column_name) FROM information_schema.columns WHERE table_name = $1 AND table_schema = ''public'')'
    )
    INTO valid_columns
    USING data_table;

    -- Step 2: Fetch names and comments from tags schema and store them in a JSONB mapping
    EXECUTE format(
        'SELECT jsonb_object_agg(lower(name), comment)
         FROM tags.%I
         WHERE label = $1',
        tag_table
    )
    INTO sel_mapping
    USING label;

    -- Filter keys of sel_mapping to include only valid columns
    sel_mapping := (
        SELECT jsonb_object_agg(key, sel_mapping->>key)
        FROM jsonb_object_keys(sel_mapping) AS key
        WHERE key = ANY(valid_columns)
    );

    -- Check if sel_mapping is empty
    IF sel_mapping IS NULL THEN
        RAISE EXCEPTION 'No valid names found for label %', label;
    END IF;

    -- Step 3: Build and execute dynamic query using the comment mapping
    query := format(
        'SELECT created_at::timestamp AS created_at,
                jsonb_agg(jsonb_build_object(%s)) AS result
         FROM %I t
         WHERE t.endpoint = $1
           AND t.created_at BETWEEN TO_TIMESTAMP($2 / 1000) AND TO_TIMESTAMP($3 / 1000)
         GROUP BY created_at',
        array_to_string(ARRAY(
            SELECT format('''%s'', %I', sel_mapping->>key, key)
            FROM jsonb_object_keys(sel_mapping) AS key
        ), ', '),
        data_table
    );

    RETURN QUERY EXECUTE query USING endpoint_id, __from, __to;
END;
$$ LANGUAGE plpgsql;
