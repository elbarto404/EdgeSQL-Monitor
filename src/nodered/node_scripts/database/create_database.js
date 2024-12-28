// Check if payload exists
if (!msg.payload) {
    node.error("No payload");
    return [null, null];
}

// Retrieve the database name from msg.target
const dbName = msg.target;

if (!dbName) {
    node.error("Database name is missing");
    return [null, null];
}

// Check if the database already exists based on payload length
if (msg.payload.length > 0) {
    // Database already exists --> skip creation
    return [null, msg];
}

// Construct the CREATE DATABASE query with proper syntax
msg.query = `

    CREATE DATABASE "${dbName}";
    
`;

// Set topic
msg.topic = "init_database";

return [msg, null];

