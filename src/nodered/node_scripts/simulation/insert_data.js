// Node-RED function node JavaScript code to generate an INSERT query for PostgreSQL

// Fetch the global variable storing the table definition
const table = global.get('tags_reversy_odr_s7');
const data_table = 'data_reversy_odr_s7';

const payload = msg.payload;

// Filter only the columns that are enabled
const enabledColumns = table.filter(col => col.enabled);

// Generate column names and values based on the payload, adding 'created_at' and 'endpoint' first
const create_at = msg.time || new Date();
const columns = ['created_at', 'endpoint', ...enabledColumns.map(col => col.name)];
const values = [new Date(create_at).toISOString(), 11, ...enabledColumns.map(col => payload[col.name])];

// Generate the SQL query string using parameterized queries
msg.query = `INSERT INTO ${data_table} (${columns.join(', ')}) VALUES (${columns.map((_, index) => `$${index + 1}`).join(', ')})`;
msg.params = values;

// Return the message object with the generated query and parameters
return msg;
