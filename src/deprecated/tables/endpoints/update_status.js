// Function to format strings by replacing underscores with spaces and capitalizing each word
function capitalize(str) {
    return str
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Retrieve existing table data from global context
const table = global.get("endpoints") || [];

const machines = global.get("machines");
const machinesName = machines.map(mh => mh.name);

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

// Update Enabling based on machine
for (let i = 0; i < table.length; i++) {
    const machine = machines.find(m => m.name === table[i].machine); // Find the machine by name
    if (machine) {
        table[i].enabled = table[i].enabled && machine.enabled; // Update enabled status
    } 
}

// Prepare dashboard table data
msg.data = table;

msg.dashboard = msg.dashboard || {};
msg.dashboard.table = {
    title: "Endpoints",
    headers: baseHeaders,
};
msg.dashboard.form = { 
    machine: machinesName,
    protocol: global.get("protocol"),
    tag_tables: ["odr_table_S7", "odr_table_OPCUA", "odr_table_Modbus"]
};

// Save updated table back to global context
global.set("endpoints", table);

// Notify state and return
const now = new Date().toISOString();
const state = {
    payload: { fill: "green", shape: "dot", text: `last update: ${now}` }
};
return [msg, state];
