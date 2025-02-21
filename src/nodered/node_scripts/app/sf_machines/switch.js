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
    msg.error = "Message with wrong table";
}

// Topic switch
const indexMap = {
    // Previous Error
    error: 4,

    // Previous Action (postgres response)
    check_table: 1,
    database_updated: 1,
    select_data: 3,

    // Next Action
    start: 0,
    update: 1,
    update_database: 2,
};

const outputs = [null, null, null, null, null];

if (msg.error) outputs[0] = msg;
else if (indexMap[msg.topic] !== undefined) outputs[indexMap[msg.topic]] = msg;

return outputs;


