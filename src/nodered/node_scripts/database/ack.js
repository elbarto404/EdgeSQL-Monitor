// Expected commands
const expectedCommands = [
    
    "SELECT"    // Replace with the espected query action
    
    ];

// Initialize received commands
let receivedCommands = [];

// Check if msg.pgsql is an array or an object
if (Array.isArray(msg.pgsql)) {
    receivedCommands = msg.pgsql.map(item => item.command);
} else if (msg.pgsql && typeof msg.pgsql === "object" && msg.pgsql.command) {
    receivedCommands = [msg.pgsql.command];
} else {
    node.error("Invalid pgsql format. Expected an array or an object with a 'command' property.");
    msg.error = true;
    return [msg, null]; // Exit early 
}

// Find missing commands
const missingCommands = expectedCommands.filter(cmd => !receivedCommands.includes(cmd));

// Alert with node.error if any commands are missing
if (missingCommands.length > 0) {
    node.error(`Missing commands: ${missingCommands.join(", ")}`);
    msg.error = true;
    return [msg, null]; // Exit early 
}

node.log("All expected commands are present.");
msg.error = false;

// Pass the message
return [msg, msg];

// First output - ALL
// Second output - FILTERED