CREATE OR REPLACE FUNCTION dynamic_query_full(
    data_table TEXT,
    tag_table TEXT,
    label TEXT,
    endpoint_id INT,
    __from BIGINT,
    __to BIGINT
)
RETURNS TABLE(created_at TIMESTAMP, result JSONB) AS $$
DECLARE
    sel_names TEXT[]; -- Array to hold selected names
    valid_columns TEXT[]; -- Array to hold valid columns from data_table
    query TEXT;       -- Dynamic query
BEGIN
    -- Step 1: Fetch all column names from the data_table
    EXECUTE format(
        'SELECT ARRAY(SELECT lower(column_name) FROM information_schema.columns WHERE table_name = $1 AND table_schema = ''public'')'
    )
    INTO valid_columns
    USING data_table;

    -- Step 2: Fetch names from tags schema and store in sel_names
    EXECUTE format(
        'SELECT ARRAY(SELECT lower(name) FROM tags.%I WHERE label = $1)',
        tag_table
    )
    INTO sel_names
    USING label;

    -- Filter sel_names to include only valid columns
    sel_names := ARRAY(
        SELECT name
        FROM unnest(sel_names) AS name
        WHERE name = ANY(valid_columns)
    );

    -- Check if sel_names is empty
    IF sel_names IS NULL OR array_length(sel_names, 1) IS NULL THEN
        RAISE EXCEPTION 'No valid names found for label %', label;
    END IF;

    -- Step 3: Build and execute dynamic query using sel_names
    query := format(
        'SELECT created_at::timestamp AS created_at, jsonb_agg(jsonb_build_object(%s)) AS result
         FROM %I t
         WHERE t.endpoint = $1
           AND t.created_at BETWEEN TO_TIMESTAMP($2 / 1000) AND TO_TIMESTAMP($3 / 1000)
         GROUP BY created_at',
        array_to_string(ARRAY(
            SELECT format('''%s'', %I', name, name)
            FROM unnest(sel_names) AS name
        ), ', '),
        data_table
    );

    RETURN QUERY EXECUTE query USING endpoint_id, __from, __to;
END;
$$ LANGUAGE plpgsql;
