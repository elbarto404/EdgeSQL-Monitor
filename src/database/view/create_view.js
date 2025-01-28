// Validate input parameters
if (!msg.data_table || !msg.tag_table) {
    node.error("You must specify both msg.data_table and msg.tag_table");
    return null;
}

// Assign dynamic table names
const dataTable = msg.data_table;
const tagTable = msg.tag_table;

// Generate procedure name dynamically
const procedureName = `create_views_${dataTable}`;

// Build the SQL query
msg.topic = `
DO $$
BEGIN
    CREATE OR REPLACE PROCEDURE ${procedureName}()
    LANGUAGE plpgsql
    AS $$
    DECLARE
        label RECORD;
        column_names TEXT;
        view_name TEXT;
    BEGIN
        FOR label IN 
            SELECT DISTINCT label
            FROM ${tagTable}
        LOOP
            SELECT STRING_AGG(name, ', ') INTO column_names
            FROM ${tagTable}
            WHERE label = label.label;

            view_name := format('%I_%s', '${dataTable}', label.label);

            EXECUTE format('
                CREATE OR REPLACE VIEW %I AS
                SELECT %s
                FROM %I
            ', view_name, column_names, '${dataTable}');
        END LOOP;
    END $$;
END $$;
`;
return msg;
