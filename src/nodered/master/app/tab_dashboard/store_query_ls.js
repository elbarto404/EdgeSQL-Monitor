let data = context.get('data') || {};

switch (msg.topic) {
    case 'env_variables':
        context.set('database', msg.database);
        context.set('tag_schema', msg.tag_schema);
        context.set('tag_table_name', msg.tag_table);
        context.set('data_schema', msg.data_schema);
        context.set('data_table_name', msg.data_table);
        context.set('endpoint_id', msg.endpoint_id);
        break;
    case 'submit':
        if (!data) {
            node.status({ fill: 'red', shape: 'ring', text: `No values to submit` });
            break;
        }
        const database = context.get('database');
        const tag_schema = context.get('tag_schema');
        const tag_table_name = context.get('tag_table_name');
        let tag_table = null;
        if (database && tag_schema && tag_table_name) {
            tag_table = global.get(tag_table_name);
        }
        const knownKeysArray = tag_table
            .filter(t => t.enabled)
            .map(t => t.name.toLowerCase());

        const validKeysArray = Object.keys(data).filter(key =>
            knownKeysArray.includes(key.toLowerCase())
        );
        if (validKeysArray.length === 0) {
            node.status({ fill: 'red', shape: 'ring', text: `No valid columns found for insertion.` });
            return null;
        }
        const data_schema = context.get('data_schema');
        const data_table_name = context.get('data_table_name');
        const endpoint_id = context.get('endpoint_id');
        msg.created_at = new Date();
        if (database && data_schema && data_table_name && endpoint_id) {
            msg.query = `
                INSERT INTO ${data_schema}.${data_table_name} 
                (created_at, endpoint, ${validKeysArray.join(', ')}) 
                VALUES ($1, $2, ${validKeysArray.map((_, i) => `$${i + 3}`).join(', ')})
            `;

            msg.params = [msg.created_at, endpoint_id, ...validKeysArray.map(key => data[key])];

            msg.target = database;
            msg.topic = 'store';
            return msg;
        }
        node.status({ fill: 'red', shape: 'ring', text: `Error during submit - ${database}, ${tag_schema}, ${tag_table_name}, ${data_schema}, ${data_table_name}, ${endpoint_id}` });
    case 'reset':
        data = {};
        context.set('data', data);
        node.status({ fill: 'green', shape: 'ring', text: `Temp values has been reset` });
        break;
    default:
        if (msg.payload) {
            for (let key in msg.payload) {
                data[key] = msg.payload[key];
            }
            context.set('data', data);
            node.status({ fill: 'green', shape: 'dot', text: `${Object.keys(data).length} temp values saved` });
            break;
        }
        node.status({ fill: 'red', shape: 'dot', text: `No temp values to save - ${msg.topic}` });
        break;
}

return null;