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

let snacktext = "";
switch (msg.topicMain) {
    case "save":
        snacktext = `${msg.title} Saved Successfully!`;
        break;
    case "start":
        snacktext = `${msg.title} Started Successfully!`;
        break;
}

// Assign table data to the message
msg.data = data;

msg.dashboard.table = {
    title: msg.title,
    headers: baseHeaders
};
msg.dashboard.form = {};
msg.dashboard.history = [];

msg.dashboard.snackbar = {
    show: snacktext.length > 0,
    text: snacktext,
    color: "green-lighten-3"
}

msg.dashboard.loading = false;

// Save data back to the global context
global.set(msg.database.table, data);

// Update status
const localTime = new Date().toLocaleString("it-IT", { timeZone: global.get('tz') }).replace(',', '');
node.status({ fill: "blue", shape: "dot", text: `last update: ${localTime}` });

msg.topic = 'update_table';
return msg;
