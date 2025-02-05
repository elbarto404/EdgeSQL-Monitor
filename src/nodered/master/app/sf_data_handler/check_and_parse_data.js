const timeLast = flow.get('timeLast') || new Date();
msg.created_at = new Date();

switch (msg.endpoint.protocol) {
    case 'S7': {
        if (!msg.isTrigger) {
            // check if is coherent with sample time      
        }
        msg.data = JSON.parse(JSON.stringify(msg.payload));
        break;
    }
    case 'Modbus': {
        if (!msg.isTrigger) {
            // check if is coherent with sample time
        }
        node.warn('Modbus protocol not implemented yet');
        return null;
        // put correct data in msg.payload
    }
    case 'OPC-UA': {
        if (!msg.isTrigger) {
            // check if is coherent with sample time
        }
        node.warn('OPC-UA protocol not implemented yet');
        return null;
        // put correct data in msg.payload
    }
    case 'MQTT': {
        if (!msg.isTrigger) {
            // check if is coherent with sample time
        }
        node.warn('MQTT protocol not implemented yet');
        return null;
        // put correct data in msg.payload
    }
    case 'HTTP': {
        if (!msg.isTrigger) {
            // check if is coherent with sample time
        }
        node.warn('HTTP protocol not implemented yet');
        return null;
        // put correct data in msg.payload
    }
}

// Optimized code for filtering and updating msg.tag_table and msg.payload efficiently

const knownKeysSet = new Set(msg.tag_table.filter(t => t.enabled).map(t => t.name.toLowerCase()));
const validKeysSet = new Set(
    Object.keys(msg.data).filter(key => knownKeysSet.has(key.toLowerCase()))
);

msg.tag_table.forEach(tag => {
    tag[msg.endpoint.name] = validKeysSet.has(tag.name) ? "good" : "error";
});

msg.payload = Object.fromEntries(
    Object.entries(msg.data).filter(([key]) => validKeysSet.has(key))
);

flow.set('timeLast', msg.created_at);
global.set(msg.meta_table.name, msg.tag_table);

// msg.knownSet = knownKeysSet;
msg.validSet = validKeysSet;
msg.unvalidSet = new Set(
    Object.keys(msg.data).filter(key => !knownKeysSet.has(key.toLowerCase()))
);

return msg;
