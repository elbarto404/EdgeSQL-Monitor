// SQL Insert Query 

msg.query = `

INSERT INTO ${msg.meta_table.data_table} (created_at, endpoint, ${msg.tag_table.map(t => t.name).join(', ')}) VALUES ($1, $2, ${msg.tag_table.map((t, i) => `$${i + 3}`).join(', ')})

`;

msg.params = [msg.created_at, msg.endpoint.id, ...msg.tag_table.map(t => msg.payload[t.name])];

msg.target = 'edge'
msg.topic = `insert_${msg.meta_table.name}`;
return msg;