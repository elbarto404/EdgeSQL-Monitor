// Ensure the database name is provided in msg.payload
const dbName = msg.target;

if (!dbName) {
    node.error("Database name is required in msg.dbName");
    return null;
}

// First, check if the database exists
msg.query = `
SELECT 1 AS exists 
FROM pg_database 
WHERE datname = '${dbName}';
`;

return msg;
