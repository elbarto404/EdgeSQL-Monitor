// Helper function to convert time strings to milliseconds
function timeToMilliseconds(timeStr) {
    if (timeStr === undefined || timeStr === null || timeStr === '' || timeStr.toLowerCase() === 'none') {
        return 0;
    }
    // Extract the numeric part and the unit part
    const num = parseFloat(timeStr);
    const unit = timeStr.replace(num, '').trim();

    // Convert based on the unit
    switch (unit) {
        case 'ms':
            return num; // Already in milliseconds
        case 's':
            return num * 1000; // Convert seconds to milliseconds
        case 'm':
            return num * 1000 * 60; // Convert minutes to milliseconds
        case 'h':
            return num * 1000 * 60 * 60; // Convert hours to milliseconds
        case 'd':
            return num * 1000 * 60 * 60 * 24; // Convert days to milliseconds
        default:
            node.error(`Invalid time unit - ${timeStr} - ${num} - ${unit}`);
    }
}

if (msg.error) {
    node.status({ fill: 'red', shape: 'ring', text: msg.error.message });
    return [null, null];
}

const endpoint = global.get('endpoints').filter(e => e.id === env.get('ENDPOINT_ID'))[0];
let tag_table = global.get(env.get('TAG_TABLE'));
let meta_table = global.get('tag_tables').filter(t => t.name === env.get('TAG_TABLE'))[0];
let isData = false;
let isTrigger = false;

// In next versions checks must be made at tables level
if (!endpoint || !endpoint.protocol) {
    const text = `Invalid endpoint - ${env.get('ENDPOINT_ID')}: ${!endpoint}, ${!endpoint.protocol}`
    node.error(text);
    node.status({ fill: 'red', shape: 'dot', text: text });
    return [null, null];
}

if (!meta_table || !meta_table.sampling_mode || !meta_table.sampling_freq || !meta_table.protocol) {
    const text = `Missing tag_table configuration - ${env.get('TAG_TABLE')}: ${!meta_table}, ${!meta_table.sampling_mode}, ${!meta_table.sampling_freq}, ${!meta_table.protocol}`;
    node.error(text);
    node.status({ fill: 'red', shape: 'dot', text: text });
    return [null, null];
}

if (meta_table.protocol !== endpoint.protocol) {
    const text = `Different protocols - ${env.get('TAG_TABLE')}: ${meta_table.protocol} / ${endpoint.protocol}`;
    node.error(text);
    node.status({ fill: 'red', shape: 'dot', text: text });
    return [null, null];
}

if (!tag_table || !Array.isArray(tag_table) || tag_table.length === 0) {
    const text = `Invalid tag table - ${env.get('TAG_TABLE')}: ${!tag_table}, ${!Array.isArray(tag_table)}, ${tag_table.length}`;
    node.error(text);
    node.status({ fill: 'red', shape: 'dot', text: text });
    return [null, null];
}

msg.period = timeToMilliseconds(meta_table.sampling_freq);
msg.endpoint = endpoint;
msg.tag_table = tag_table;
msg.meta_table = meta_table;
msg.isTrigger = ['Trigger'].includes(meta_table.sampling_mode);

// Topic Switch (for trigger messages)
if (msg.topic === 'trigger') {
    return [null, msg];
} else if (msg.topic === 'trigger_sent') {
    return [null, null];
} else if (msg.topic === `insert_${msg.meta_table.name}` && msg.params && msg.params.length > 0) {
    const localTime = msg.params[0].toLocaleString("it-IT", { timeZone: global.get('tz') }).replace(',', '');
    node.status({ fill: 'green', shape: 'dot', text: `Last Sample at ${localTime} - ${msg.params.length - 2} values` });
    return [null, null];
}

// Protocol Switch (for other messages)
let test1 = undefined;
let test2 = undefined;
let test3 = undefined;
let test4 = undefined;
switch (endpoint.protocol) {
    case 'S7': {
        // const allowedKeys = ['topic', 'payload', '_msgid'];
        // const msgKeys = Object.keys(msg);
        // test1 = msgKeys.every(key => allowedKeys.includes(key));
        // test2 = msgKeys.length === allowedKeys.length;
        test3 = Object.keys(msg.payload).some(key => tag_table.map(t => t.name.toLowerCase()).includes(key.toLowerCase()));
        isData = test3;
        break;
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
} else {
    node.error(`Invalid message format - ${endpoint.id}: ${endpoint.name} - ${env.get('TAG_TABLE')} - tests ${test1} ${test2} ${test3} ${test4}`);
    return [null, null];
}
