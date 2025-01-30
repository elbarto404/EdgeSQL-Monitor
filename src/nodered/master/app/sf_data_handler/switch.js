
if (msg.error) {
    node.status({ fill: 'red', shape: 'ring', text: msg.error.message });
    return [null, null];
}

const endpoint = global.get('endpoints').filter(e => e.id === env.get('ENDPOINT_ID'))[0];
let tag_table = global.get(env.get('TAG_TABLE'));
let meta_table = global.get('tag_tables').filter(t => t.name === env.get('TAG_TABLE'))[0];
let isData = false;
let isTrigger = false;

if (msg.topic === `insert_${meta_table.name}`) {
    return [null, null];
}

// In next versions checks must be made at tables level
if (!endpoint || !endpoint.protocol) {
    node.error(`Invalid endpoint - ${env.get('ENDPOINT_ID')}`);
    return [null, null];
}

if (!meta_table || !meta_table.sampling_mode || !meta_table.sampling_freq || !meta_table.protocol) {
    node.error(`Missing tag_table configuration - ${env.get('TAG_TABLE')}`);
    return [null, null];
}

if (meta_table.protocol !== endpoint.protocol) {
    node.error(`Different protocols - ${env.get('TAG_TABLE')}: ${meta_table.protocol} - ${endpoint.protocol}`);
    return [null, null];
}

if (!tag_table || !Array.isArray(tag_table) || tag_table.length === 0) {
    node.error(`Invalid tag table - ${env.get('TAG_TABLE')}`);
    return [null, null];
}

msg.endpoint = endpoint;
msg.tag_table = tag_table;
msg.meta_table = meta_table;
msg.isTrigger = ['Trigger', 'Trigger Custom'].includes(meta_table.sampling_mode);

switch (endpoint.protocol) {
    case 'S7': {
        const allowedKeys = ['topic', 'payload', '_msgid'];
        const msgKeys = Object.keys(msg);
        isData = msgKeys.every(key => allowedKeys.includes(key)) &&
            msgKeys.length === allowedKeys.length &&
            Object.keys(msg.payload).some(key => tag_table.map(t => t.name.toLowerCase()).includes(key.toLowerCase()));

    }
    case 'Modbus': {
        node.status({ fill: 'yellow', shape: 'ring', text: 'Modbus protocol not implemented yet' });
        return [null, null];
    }
    case 'OPC-UA': {
        node.status({ fill: 'yellow', shape: 'ring', text: 'OPC-UA protocol not implemented yet' });
        return [null, null];
    }
    case 'MQTT': {
        node.status({ fill: 'yellow', shape: 'ring', text: 'MQTT protocol not implemented yet' });
        return [null, null];
    }
    case 'HTTP': {
        node.status({ fill: 'yellow', shape: 'ring', text: 'HTTP protocol not implemented yet' });
        return [null, null];
    }
    default: {
        node.error(`Invalid protocol - ${endpoint.protocol}`);
        return [null, null];
    }
}

if (isData) {
    return [msg, null];
} else if (isTrigger) {
    return [null, msg];
} else {
    node.error(`Invalid message format - ${endpoint.id}: ${endpoint.name} - ${env.get('TAG_TABLE')}`);
    return [null, null];
}
