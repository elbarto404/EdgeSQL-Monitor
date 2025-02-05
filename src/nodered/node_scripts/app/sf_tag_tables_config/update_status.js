// Function to replace underscores with spaces and capitalize words
function capitalize(str) {
    const result = str
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    return result;
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
                const parsed = JSON.parse(value);
                return parsed;
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
            row[key] = parseValue(originalValue);
        });
    });
}

// Extract tag table names
let tag_tables = [];
if (msg.pgsql && msg.pgsql[2] && msg.pgsql[2].rows) {
    tag_tables = msg.pgsql[2].rows.map(row => row.table_name);
}

// CHECK DATA
// Check if all tag tables are present in the database
let deploy_needed = false;
tag_tables.forEach(tableName => {
    if (!data.some(row => row.name === tableName)) {
        let newItem = {
            name: tableName,
            data_table: tableName + '_data',
            protocol: null,
            sampling_mode: 'static',
            sampling_freq: 'none',
            comment: 'auto-generated, modification needed for proper configuration',
        };
        let editAction = {
            index: -1,
            oldItem: null,
            newItem: newItem,
        };
        msg.dashboard.history = msg.dashboard.history || [];
        msg.dashboard.history.push(editAction);
        deploy_needed = true;
    }
});

// DASHBOARD MANAGEMENT
// Build dynamic table headers
const baseHeaders = columns.length > 0
    ? columns
        .filter(key => !['actions', 'status', 'id'].includes(key)) // Excludes some columns
        .map(key => {
            const header = {
                title: capitalize(key),
                value: key,
                headerProps: { style: 'font-weight: 700' },
                sortable: true
            };
            return header;
        })
    : [];

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
    protocol: global.get("protocol"),
    sampling_mode: global.get("sampling_mode"),
    sampling_freq: global.get("sampling_freq"),
};
msg.dashboard.history = msg.dashboard.history || [];
msg.dashboard.snackbar = {
    show: true,
    text: snacktext,
    color: "green-lighten-3"
};
msg.dashboard.loading = false;

// SAVE, NOTIFY, SEND
// Save data back to the global context
global.set(msg.database.table, data);

// Update status
const localTime = new Date().toLocaleString("it-IT", { timeZone: global.get('tz') }).replace(',', '');
node.status({ fill: "green", shape: "dot", text: `last update: ${localTime}` });

// Determine the next step based on deploy_needed flag
if (deploy_needed) {
    msg.topic = 'deploy';
    return [null, msg];
} else {
    // Prepare the dynamic_insert history and reset the dashboard history
    msg.history = [...msg.dashboard.history];
    msg.dashboard.history = [];
    msg.topic = 'update_status';
    return [msg, null];
}
