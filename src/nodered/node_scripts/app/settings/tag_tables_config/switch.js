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
msg.database = msg.database || {};

msg.database.name = env.get("DATABASE");
msg.database.schema = env.get("SCHEMA");
msg.database.table = tabName;
msg.database.tagsSchema = env.get("TAGS_SCHEMA");
msg.database.dataSchema = env.get("DATA_SCHEMA");

global.set("dataSchema", env.get("DATA_SCHEMA"));  // Save data schema for common tags_table use
msg.data = msg.data || flow.get(tabName) || null;
msg.dashboard = msg.dashboard || {};
msg.dashboard.info = msg.dashboard.info || flow.get("info");

if (msg.database.table !== tabName) {
    msg.error = "Message with wrong table";
}

// Topic switch
const indexMap = {
    // Previous Error
    error:          0,

    // Previous Action (postgres response)
    check_table:    2,
    deploy_changes: 2,
    select_data:    4,

    // Next Action
    start:          1,
    update:         2,
    deploy:         3,   
};

const outputs = [null, null, null, null, null];

if (msg.error) outputs[0] = msg;
else if (indexMap[msg.topic] !== undefined) outputs[indexMap[msg.topic]] = msg;

return outputs;


