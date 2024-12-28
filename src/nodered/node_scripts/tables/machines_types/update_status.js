// Function to format strings by replacing underscores with spaces and capitalizing each word
function capitalize(str) {
    return str
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Retrieve existing table data from global context
const table = global.get("machines_types") || [];

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

// Define possible states for endpoints
const states = ["unknown", "connected", "connected","connected","connected","connected","connected","connected","connected","connected","connected","connected","connecting", "error"];
const lengthItems = states.length;

// Assign random states to endpoints if not already set
for (let i = 0; i < table.length; i++) {  
    let randomIndex = Math.floor(Math.random() * lengthItems);
    if (!table[i].status) {
        table[i].status = states[randomIndex];
    }
    if (typeof table[i].enabled === 'string') {
        let enabledLower = table[i].enabled.toLowerCase();
        table[i].enabled = (enabledLower === 'true');
    }
    if (table[i].enabled === null) {
        table[i].enabled = true;
    }
}

// Prepare dashboard table data
msg.data = table;

msg.dashboard = msg.dashboard || {};
msg.dashboard.table = {
    title: "Machines Types", 
    headers: baseHeaders
};
msg.dashboard.form = { 
    machine: ["machine_1","machine_2","machine_3","machine_4","machine_5"],
    protocol: global.get("protocol"),
    tag_tables: ["odr_table_S7", "odr_table_OPCUA", "odr_table_Modbus"]
};

// Save updated table back to global context
global.set("machines_types", table);

// Notify state and return
const now = new Date().toISOString();
const state = {
    payload: { fill: "green", shape: "dot", text: `last update: ${now}` }
};
return [msg, state];
