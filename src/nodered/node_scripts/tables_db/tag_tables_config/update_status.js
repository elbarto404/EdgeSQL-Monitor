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

// Retrieve existing data or initialize
let columns = [];
let data = global.get(msg.database.table) || [];

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

let tag_tables = [];
if (msg.pgsql && msg.pgsql[2] && msg.pgsql[2].rows) {
    tag_tables = msg.pgsql[2].rows.map(row => row.table_name);
}

// Check if all tag tables are present in the database
let deploy_needed = false;
tag_tables.forEach(tableName => {
    if (!data.some(row => row.name === tableName)) {
        let newItem = {
            name: tableName,
            sampling_mode: 'none',
            sampling_freq: 'none',
            aggregation: 'none',
            comment: 'auto-generated, modification needed for proper configuration',
        }
        let editAction = {
            index: -1,
            oldItem: null,
            newItem: newItem,
        }
        msg.dashboard.history = msg.dashboard.history || [];
        msg.dashboard.history.push(editAction);
        deploy_needed = true;
    }
});

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


// Define possible states for endpoints
const states = ["unknown", "connected", "connected","connected","connected","connected","connected","connected","connected","connected","connected","connected","connecting", "error"];
const lengthItems = states.length;

// Assign random states to endpoints if not already set
for (let i = 0; i < data.length; i++) {  
    let randomIndex = Math.floor(Math.random() * lengthItems);
    if (!data[i].status) {
        data[i].status = states[randomIndex];
    }
    if (typeof data[i].enabled === 'string') {
        let enabledLower = data[i].enabled.toLowerCase();
        data[i].enabled = (enabledLower === 'true');
    }
    if (data[i].enabled === null) {
        data[i].enabled = true;
    }
}

let snacktext = "";
if (msg.topicMain === "deploy") {
    snacktext = `${msg.title} Saved Successfully!`;
} else if (msg.topicMain === "update") {
    snacktext = `${msg.title} Updated Successfully!`;
} else if (msg.topicMain === "start") {
    snacktext = `${msg.title} Started Successfully!`;
}

// Assign table data to the message
msg.data = data;

msg.dashboard.table = {
    title: msg.title,
    headers: baseHeaders,
};
msg.dashboard.form = { 
    sampling_mode: global.get("sampling_mode"),
    sampling_freq: global.get("sampling_freq"),
    aggregation: global.get("aggregation"),
};

msg.dashboard.history = msg.dashboard.history || [];

msg.dashboard.snackbar = {
    show: true,
    text: snacktext,
    color: "green-lighten-3"
}

msg.dashboard.loading = false;

// Save data back to the global context
global.set(msg.database.table, data);

// Return updated state
const now = new Date().toISOString();
const state = {
    payload: { fill: "green", shape: "dot", text: `last update: ${now}` },
    _msgid: msg._msgid
};

if (deploy_needed) {
    msg.topic = 'deploy';
    return [msg, null, null];
} else {
    msg.topic = 'update_status';
    return [null, msg, state];
}