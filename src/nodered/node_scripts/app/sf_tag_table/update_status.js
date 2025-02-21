// Function to replace underscores with spaces and capitalize words
function capitalize(str) {
    return str
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
function parseValue(value) {
    if (typeof value === 'string') {
        // Remove leading/trailing quotes and unescape inner quotes if present
        if ((value.startsWith('"[') && value.endsWith(']"')) || (value.startsWith('"{') && value.endsWith('}"'))) {
            value = value.slice(1, -1).replace(/""/g, '"');
        }

        // Parse value as JSON if it's a valid JSON string
        if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))) {
            try {
                return JSON.parse(value);
            } catch (error) {
                return value;
            }
        }
        // Return original value for non-JSON types
        return value;
    }
    return value;
}

// GET DATA
// Retrieve existing data or initialize
let columns = [];
let data = global.get(msg.database.table) || [];
let dataOld = global.get(msg.database.table) || [];

const endpoints = (global.get("endpoints") || [])
    .filter(ep => Array.isArray(ep.tag_tables) && ep.tag_tables.some(tag => tag === msg.database.table));
const endpointNames = endpoints.map(ep => ep.name);

// Extract column names from PostgreSQL query
if (msg.pgsql && msg.pgsql[0] && msg.pgsql[0].rows) {
    columns = msg.pgsql[0].rows.map(col => col.column_name);
}

// Extract data rows from PostgreSQL query and parse them
if (msg.pgsql && msg.pgsql[1] && msg.pgsql[1].rows) {
    data = msg.pgsql[1].rows;
    data.forEach((row, rowIndex) => {
        Object.keys(row).forEach((key) => {
            let originalValue = row[key];
            row[key] = parseValue(originalValue)
        });
    });
}

// CHECK DATA
let deploy_needed = false;
if (msg.database.replace_all_procedures) {
    deploy_needed = true;
}

// DASHBOARD MANAGEMENT
// Build dynamic table headers
const baseHeaders = columns.length > 0
    ? columns
        .filter(key => !['actions', 'status', 'id'].includes(key)) // Exludes some columns
        .map(key => ({
            title: capitalize(key),
            value: key,
            headerProps: { style: 'font-weight: 700' },
            sortable: true
        }))
    : [];

// Build table header for endpoints
const endpointsHeader = {
    title: "Endpoints",
    value: "endpoints",
    headerProps: { style: 'font-weight: 700' },
};

for (let datum of data) { 
    for (let endpoint of endpoints) {
        // Check if the datum does not already have a value for the endpoint name
        if (!datum[endpoint.name]) {
            const oldItem = dataOld.find(item => item.id === datum.id);
            if (oldItem && oldItem[endpoint.name]) {
                datum[endpoint.name] = oldItem[endpoint.name]; 
            } else {
                datum[endpoint.name] = endpoint.status; 
            }
        }
    }
}

switch (msg.topicMain) {
    case "update_database":
        snacktext = `${msg.title} Saved Successfully!`;
        break;
    case "start":
        snacktext = `${msg.title} Started Successfully!`;
        break;
}

// Assign message properties
msg.data = data;
msg.endpoints = endpoints;

msg.dashboard.table = {
    title: msg.title,
    headers: [...baseHeaders, endpointsHeader],
    baseHeaders: baseHeaders,
    otherHeaders: [endpointsHeader]
};
msg.dashboard.form = {
    data_type: Object.keys(global.get("data_type")),
    access: global.get("access"),
    aggregation_type: global.get("aggregation_type"),
    protocol: env.get("PROTOCOL")
};

msg.dashboard.history = msg.dashboard.history || [];

msg.dashboard.snackbar = {
    show: snacktext.length > 0,
    text: snacktext,
    color: "green-lighten-3"
}

msg.dashboard.loading = false;

// SAVE, NOTIFY, SEND
// Save data back to the global context
global.set(msg.database.table, data);

// Node State Update
const localTime = new Date().toLocaleString("it-IT", { timeZone: global.get('tz') }).replace(',', '');
node.status({ fill: "blue", shape: "dot", text: `last update: ${localTime}` });


if (deploy_needed) {
    msg.topic = 'update_database';
    return [null, msg];
} else {
    // Prapare the dynamic_insert history and resets the dashboard history
    msg.history = [...msg.dashboard.history];
    msg.dashboard.history = [];

    msg.topic = 'update_status';
    return [msg, null];
}