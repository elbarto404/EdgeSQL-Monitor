CREATE OR REPLACE FUNCTION dynamic_query_filtered(
    data_table TEXT,
    label TEXT,
    endpoint_id INT,
    __from BIGINT,
    __to BIGINT
)
RETURNS TABLE(result JSON) AS $$
DECLARE
    dynamic_query TEXT;
BEGIN
    -- Construct the dynamic query with filters
    dynamic_query := format(
        'SELECT row_to_json(t)
         FROM %I_%I t
         WHERE t.endpoint = %s
           AND t.created_at BETWEEN TO_TIMESTAMP(%s / 1000)
                                AND TO_TIMESTAMP(%s / 1000)',
        regexp_replace(data_table, '[^a-zA-Z0-9_]', '_', 'g'),
        regexp_replace(label, '[^a-zA-Z0-9_]', '_', 'g'),
        endpoint_id::TEXT, -- Ensuring compatibility
        __from,
        __to
    );

    -- Execute the query and return the results
    RETURN QUERY EXECUTE dynamic_query;
END $$ LANGUAGE plpgsql;
