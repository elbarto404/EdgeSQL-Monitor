// Function to format strings by replacing underscores with spaces and capitalizing each word
function capitalize(str) {
    return str
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Retrieve existing table data from global context
const table = global.get("tag_tables") || [];

// Create dynamic table headers based on table data
const baseHeaders = table.length > 0
    ? Object.keys(table[0])
        .filter(key => key !== "status")
        .map(key => ({
            title: capitalize(key),
            value: key,
            headerProps: { style: 'font-weight: 700' },
        }))
    : [];

// Prepare dashboard table data
msg.data = table;

msg.dashboard = msg.dashboard || {};
msg.dashboard.table = {
    title: "Tag Tables", 
    headers: baseHeaders
};

// Save updated table back to global context
global.set("machines_types", table);

// Notify state and return
const now = new Date().toISOString();
const state = {
    payload: { fill: "green", shape: "dot", text: `last update: ${now}` }
};
return [msg, state];
