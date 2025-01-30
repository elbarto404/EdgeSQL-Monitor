// SQL Insert Query 

msg.query = `

INSERT INTO ${msg.meta_table.name} (created_at, ${msg.tag_table.map(t => t.name).join(', ')}) VALUES ($1, ${msg.tag_table.map((t, i) => `$${i + 2}`).join(', ')})

`;

msg.params = [msg.created_at, ...msg.tag_table.map(t => msg.payload[t.name])];

msg.topic = `insert_${msg.meta_table.name}`;
return msg;