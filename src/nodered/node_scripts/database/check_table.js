msg.database = {
    name: env.get("DATABASE"),
    schema: env.get("SCHEMA"),
    table: env.get("TABLE")
};

msg.query = `
    CREATE TABLE IF NOT EXISTS ${msg.database.schema}.${msg.database.table} (
        type VARCHAR(255) PRIMARY KEY,
        vendor VARCHAR(255),
        details VARCHAR(255)
    );
`;

msg.topic = "check_table";
return msg;
