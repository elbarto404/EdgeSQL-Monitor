CREATE SCHEMA IF NOT EXISTS ODR AUTHORIZATION john_doe;

SET TIME ZONE 'Europe/Rome';




-- Create schema only if it doesn't exist
CREATE SCHEMA IF NOT EXISTS odr;

-- Grant permissions on the schema
GRANT USAGE ON SCHEMA odr TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA odr TO PUBLIC;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA odr TO PUBLIC;

-- Set the search_path for the database
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_database
        WHERE datname = 'lime_klin_report'
    ) THEN
        RAISE NOTICE 'Database lime_klin_report does not exist.';
    ELSE
        ALTER DATABASE lime_klin_report SET search_path TO odr, public;
    END IF;
END $$;







-- Create schema only if it doesn't exist
CREATE SCHEMA IF NOT EXISTS odr;

-- Grant all permissions on the schema to PUBLIC
GRANT ALL ON SCHEMA odr TO PUBLIC;

-- Grant all permissions on all existing tables in the schema to PUBLIC
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_namespace
        WHERE nspname = 'odr'
    ) THEN
        EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA odr TO PUBLIC';
        EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA odr TO PUBLIC';
        EXECUTE 'GRANT ALL ON ALL FUNCTIONS IN SCHEMA odr TO PUBLIC';
    END IF;
END $$;

-- Alter database to set search_path to include the schema
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_database
        WHERE datname = 'lime_klin_report'
    ) THEN
        ALTER DATABASE lime_klin_report SET search_path TO odr, public;
    END IF;
END $$;





-- Connect to the new database and configure schema and permissions
DO $$
BEGIN
    -- Create the 'odr' schema
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS odr';

    -- Grant permissions to the user 'edge'
    EXECUTE 'GRANT ALL ON SCHEMA odr TO edge';

    -- Grant all permissions on all tables, sequences, and functions in the schema
    EXECUTE $cmd$
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_namespace
                WHERE nspname = 'odr'
            ) THEN
                EXECUTE ''GRANT ALL ON ALL TABLES IN SCHEMA odr TO edge'';
                EXECUTE ''GRANT ALL ON ALL SEQUENCES IN SCHEMA odr TO edge'';
                EXECUTE ''GRANT ALL ON ALL FUNCTIONS IN SCHEMA odr TO edge'';
            END IF;
        END $$;
    $cmd$;

    -- Set the search_path for the new database
    EXECUTE 'ALTER DATABASE ${dbName} SET search_path TO odr, public';
END $$;
`