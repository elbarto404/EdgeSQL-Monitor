try {
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

    msg.payload.forEach(item => {
        if (typeof item.tag_tables === "string") {
            try {
                item.tag_tables = JSON.parse(item.tag_tables);
            } catch (error) {
                node.error("Error parsing tag_table:", error);
            }
        }
    });

    // Store payload in global context
    global.set("endpoints", msg.payload);

    // Clear payload to prevent unintended propagation
    msg.payload = null;
    return msg;

} catch (error) {
    node.error(`An error occurred: ${error.message}`);
    return msg;
}
