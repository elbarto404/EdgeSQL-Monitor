msg.query = `

    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = '${msg.database.schema}'
    AND table_name = '${msg.database.table}';

    SELECT * 
    FROM ${msg.database.schema}.${msg.database.table}
    ORDER BY id;

    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = '${msg.database.tagsSchema}'
    ORDER BY table_name;

`;

msg.target = msg.database.name;
msg.topic = "select_data";
return msg;