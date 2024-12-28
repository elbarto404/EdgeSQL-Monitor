try {
    // Validate msg.file and msg.file.title
    if (!msg.file || !msg.file.title) {
        node.warn("msg.file.title is undefined");
        return msg;
    }

    // Validate that msg.payload is an array
    if (!Array.isArray(msg.payload)) {
        node.warn("msg.payload is not an array");
        return msg;
    }

    // Validate that msg.columns exists and is a non-empty string
    if (!msg.columns || typeof msg.columns !== 'string') {
        node.warn("msg.columns is undefined or not a string");
        return msg;
    }

    // Store payload in global context
    const tags = global.get("tags") || {};
    tags[msg.file.title] = msg.payload;
    global.set("tags", tags);

    // Clear payload to prevent unintended propagation
    msg.payload = null;
    return msg;

} catch (error) {
    node.error(`An error occurred: ${error.message}`);
    return null;
}
