// Extract schema and table names from the message
const schemaName = msg.database.schema;
const tableName = msg.database.table;
const dataSchema = msg.database.dataSchema;
const dataTable = msg.database.dataTable;

// Construct the dynamic query for creating the schema and the table
msg.query = `
DO $$
BEGIN
   -- Check if schema exists and create if it doesn't
   IF NOT EXISTS (
      SELECT 1
      FROM information_schema.schemata
      WHERE schema_name = '${schemaName}'
   ) THEN
      CREATE SCHEMA ${schemaName};
   END IF;

   -- Check if tags table exists and create if it doesn't
   IF NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = '${schemaName}' AND table_name = '${tableName}'
   ) THEN
      CREATE TABLE ${schemaName}.${tableName} (
        id SERIAL,
        enabled BOOLEAN,
        name TEXT PRIMARY KEY,
        label TEXT,
        data_type TEXT,
        address TEXT,
        access TEXT,
        comment TEXT
      );
   END IF;

   -- Check if data table exists and create if it doesn't
   IF NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = '${dataSchema}' AND table_name = '${dataTable}'
   ) THEN
      CREATE TABLE ${dataSchema}.${dataTable} (
         created_at TIMESTAMP,
         endpoint NUMERIC,
         PRIMARY KEY (created_at, endpoint)
      );
   END IF;
END $$;
`;

msg.target = msg.database.name;
msg.topic = "check_table";
return msg;
