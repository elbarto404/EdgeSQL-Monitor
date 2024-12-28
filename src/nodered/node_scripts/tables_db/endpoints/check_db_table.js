msg.query = `

    CREATE TABLE IF NOT EXISTS ${msg.database.schema}.${msg.database.table} (
        id SERIAL,
        enabled BOOLEAN,
        name TEXT PRIMARY KEY,
        machine TEXT,
        protocol TEXT,
        address TEXT,
        node_id TEXT,
        tag_tables TEXT,
        comment TEXT
    );
    
`;

msg.target = msg.database.name;
msg.topic = "check_table";
return msg;