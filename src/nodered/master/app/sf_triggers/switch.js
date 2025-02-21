// Function to format strings by replacing underscores with spaces and capitalizing each word
function capitalize(str) {
    return str
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Init
const tabName = env.get('TABLE');
msg.title = capitalize(tabName);
msg.topicMain = msg.topicMain || msg.topic;
msg.database = msg.database || {
    name: env.get("DATABASE"),
    schema: env.get("SCHEMA"),
    table: tabName
};
msg.data = msg.data || flow.get(tabName) || null;
msg.dashboard = msg.dashboard || {};
msg.dashboard.info = msg.dashboard.info || flow.get("info");

if (msg.database.table !== tabName) {
    node.error("Message with wrong table");
}

const outputs = [null, null, null, null, null];

if (msg.error) {
    outputs[4] = msg;
} else {
    switch (msg.topic) {
        case "start":
            outputs[0] = msg;
            break;
        case "save":
            outputs[1] = msg;
            break;
        case "update":
        case "check_table":
        case "update_database":
            outputs[2] = msg;
            break;
        case "select_data":
            outputs[3] = msg;
            break;
        default:
            node.status({ fill: "yellow", shape: "dot", text: "Input message not recognised" });
            break;
    }
}

return outputs;


