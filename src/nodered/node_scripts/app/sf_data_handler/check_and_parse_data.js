msg.created_at = new Date();
const timeLast = flow.get('timeLast') || msg.created_at - msg.period;
const min_interval = msg.period * 0.95;

switch (msg.endpoint.protocol) {
    case 'S7': {
        if (!msg.isTrigger) {
            if (msg.created_at - timeLast < min_interval) {
                msg.status = { fill: 'blue', shape: 'ring', text: 'Data received but not sent - min interval not passed' };
                return null;
            }    
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

const knownKeysArray = msg.tag_table
    .filter(t => t.enabled)
    .map(t => t.name.toLowerCase());

const validKeysArray = Object.keys(msg.data).filter(key => 
    knownKeysArray.includes(key.toLowerCase())
);

msg.tag_table.forEach(tag => {
    tag[msg.endpoint.name] = validKeysArray.includes(tag.name) ? "good" : "error";
});

msg.payload = Object.fromEntries(
    Object.entries(msg.data).filter(([key]) => validKeysArray.includes(key))
);

flow.set('timeLast', msg.created_at);
global.set(msg.meta_table.name, msg.tag_table);

// msg.knownArray = knownKeysArray;
msg.validArray = validKeysArray;
msg.unvalidArray = Object.keys(msg.data).filter(key => 
    !knownKeysArray.includes(key.toLowerCase())
);

return msg;
