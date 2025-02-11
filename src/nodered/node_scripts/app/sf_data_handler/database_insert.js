// SQL Insert Query 
const validKeysArray = msg.validArray || []; 

// Ensure validKeysArray is not empty before proceeding
if (validKeysArray.length === 0) {
    node.error("No valid columns found for insertion.");
}

// Construct the SQL query dynamically
msg.query = `
INSERT INTO ${msg.meta_table.data_table} 
(created_at, endpoint, ${validKeysArray.join(', ')}) 
VALUES ($1, $2, ${validKeysArray.map((_, i) => `$${i + 3}`).join(', ')})
`;

// Construct parameter values, ensuring they are pulled from msg.payload
msg.params = [msg.created_at, msg.endpoint.id, ...validKeysArray.map(key => msg.payload[key])];

msg.target = 'edge';
msg.topic = `insert_${msg.meta_table.name}`;

return msg;
