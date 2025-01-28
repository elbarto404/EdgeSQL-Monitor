CREATE OR REPLACE FUNCTION dynamic_query(data_table TEXT, label TEXT)
RETURNS SETOF RECORD AS $$
DECLARE
    dynamic_query TEXT;
BEGIN
    -- Construct the dynamic query
    dynamic_query := format(
        'SELECT * FROM %I_%I',
        regexp_replace(data_table, '[^a-zA-Z0-9_]', '_', 'g'),
        regexp_replace(label, '[^a-zA-Z0-9_]', '_', 'g')
    );

    -- Execute the query and return the result dynamically
    RETURN QUERY EXECUTE dynamic_query;
END $$ LANGUAGE plpgsql;
