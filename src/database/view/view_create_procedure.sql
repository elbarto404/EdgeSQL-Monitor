CREATE OR REPLACE PROCEDURE create_views_by_label(tag_table TEXT, data_table TEXT, view_prefix TEXT)
LANGUAGE plpgsql AS $$
DECLARE
    lbl RECORD;
    column_names TEXT;
    sanitized_label TEXT;
    sanitized_prefix TEXT;
    view_name TEXT;
BEGIN
    -- Sanitize the view prefix to prevent issues with PostgreSQL naming conventions 
    -- (replace spaces with underscores, remove special characters, and convert to lowercase)
    sanitized_prefix := LOWER(REGEXP_REPLACE(REPLACE(view_prefix, ' ', '_'), '[^a-zA-Z0-9_]', '', 'g'));

    -- Loop through each distinct label in the tag table
    FOR lbl IN 
        EXECUTE FORMAT('SELECT DISTINCT label FROM %s', tag_table)
    LOOP
        -- Retrieve all column names with the current label
        EXECUTE FORMAT('SELECT STRING_AGG(name, '', '') FROM %s WHERE label = %L', tag_table, lbl.label)
        INTO column_names;

        -- Sanitize the label (replace spaces with underscores, remove special characters, and convert to lowercase)
        sanitized_label := LOWER(REGEXP_REPLACE(REPLACE(lbl.label, ' ', '_'), '[^a-zA-Z0-9_]', '', 'g'));

        -- Construct the view name using the sanitized prefix and label
        view_name := FORMAT('%s_%s', sanitized_prefix, sanitized_label);

        -- Create or replace the view
        EXECUTE FORMAT('
            CREATE OR REPLACE VIEW %I AS
            SELECT %s
            FROM %s
        ', view_name, column_names, data_table);
    END LOOP;
END;
$$;




