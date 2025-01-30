// Ensure the database name is provided in msg.payload
if (!msg.database.name) {
    node.error("Database name is required in msg.database.name");
    return null;
}

// First, check if the database exists
msg.query = `
SELECT 1 AS exists 
FROM pg_database 
WHERE datname = '${msg.database.name}';
`;

return msg;
