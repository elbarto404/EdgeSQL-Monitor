-- 1. Connect to an existing database (e.g., 'postgres' or any other default database)
-- Ensure you're connected to a database that already exists

-- 2. Install the dblink extension if not already installed
CREATE EXTENSION IF NOT EXISTS dblink;

-- 3. Execute a DO block to conditionally create the database
DO
$$
BEGIN
    -- Check if the database exists
    IF NOT EXISTS (
        SELECT FROM pg_database WHERE datname = 'lime_klin_report'
    ) THEN
        -- Use dblink to execute CREATE DATABASE in a separate connection
        PERFORM dblink_exec('dbname=postgres user=edge password=edgeadmin', 'CREATE DATABASE lime_klin_report');
        RAISE NOTICE 'Database "lime_klin_report" has been created.';
    ELSE
        RAISE NOTICE 'Database "lime_klin_report" already exists.';
    END IF;
END
$$;