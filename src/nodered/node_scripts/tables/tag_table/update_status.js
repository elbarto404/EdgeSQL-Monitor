// Function to format strings by replacing underscores with spaces and capitalizing each word
function capitalize(str) {
    return str
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const title = msg.file.title;
const endpoints = (global.get("endpoints") || [])
    .filter(ep => Array.isArray(ep.tag_tables) && ep.tag_tables.some(tag => tag === title));
const endpointNames = endpoints.map(ep => ep.name);

// Retrieve existing table data from global context
const tags = global.get("tags") || {};
const table = tags[title] || [];

// Create dynamic table headers for endpoints
const endpointsHeaders = [{
    title: "Endpoints",    
    value: "endpoints",    
    headerProps: { style: 'font-weight: 700' }, 
}];

// Create dynamic table headers based on table data, excluding endpoint keys
const baseHeaders = table.length > 0
    ? Object.keys(table[0])
        .filter(key => !endpointNames.includes(key)) 
        .map(key => ({
            title: capitalize(key),
            value: key,
            headerProps: { style: 'font-weight: 700' },
        }))
    : [];

// Define possible states for endpoints
const states = ["unknown", "connected", "connected", "connected", "connected", "connected", "connected", "connected", "connected", "connected", "connected", "connected", "connecting", "error"];
const lengthItems = states.length;

// Assign random states to endpoints if not already set
for (let i = 0; i < table.length; i++) {
    for (let e = 0; e < endpointNames.length; e++) {
        let endpointName = endpointNames[e];
        if (!table[i][endpointName]) {
            let randomIndex = Math.floor(Math.random() * lengthItems);
            table[i][endpointName] = states[randomIndex];
        }
    }
}

// Prepare dashboard table data
msg.data = table;
msg.endpoints = endpoints;

msg.dashboard = msg.dashboard || {};
msg.dashboard.table = {
    title: msg.file.title,
    headers: [ ...baseHeaders, ...endpointsHeaders ],
    baseHeaders: baseHeaders,
    otherHeaders: endpointsHeaders
};
msg.dashboard.form = { 
    data_type: global.get("data_type"),
    access: global.get("access"),
    aggregation_type: global.get("aggregation_type")
};

// Save updated table back to global context
tags[title] = table;
global.set("tags", tags);

// Notify state and return
const now = new Date().toISOString();
const state = {
    payload: { fill: "green", shape: "dot", text: `last update: ${now}` }
};
return [msg, state];
