msg.query = `

    CREATE TABLE IF NOT EXISTS ${msg.database.schema}.${msg.database.table} (
        id SERIAL,
        name TEXT PRIMARY KEY,
        type TEXT,
        site TEXT,
        service_date TEXT,
        details TEXT
    );
    
`;

msg.target = msg.database.name;
msg.topic = "check_table";
return msg;