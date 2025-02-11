if (msg.error) {
    node.status({fill: 'red', shape: 'dot', text: msg.error});
    return null;
}

switch(msg.topic) {
    case 'env_variables':
        context.set('database', msg.database);
        context.set('tag_schema', msg.tag_schema);
        context.set('tag_table_name', msg.tag_table);
        context.set('data_schema', msg.data_schema);
        context.set('data_table_name', msg.data_table);
        context.set('endpoint_id', msg.endpoint_id);
        return msg;
    case 'store':
        const localTime = msg.created_at.toLocaleString("it-IT", { timeZone: global.get('tz') }).replace(',', '');
        if (!msg.params || msg.params.length === 0){
            node.status({fill: 'red', shape: 'dot', text: `No values submitted at ${localTime}`});
            return null;
        }
        node.status({fill: 'green', shape: 'dot', text: `${msg.params.length} values sucessfully stored at ${localTime}`});
        return {topic: 'reset'};
    case 'submit':
        return msg;
    case 'reset':
        return msg;
    default:
        node.status({fill: 'yellow', shape: 'ring', text: `Topic not recognized: ${msg.topic}`});
        return null;
}
